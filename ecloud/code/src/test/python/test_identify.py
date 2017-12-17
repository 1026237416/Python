# -*- coding: utf-8 -*-

import uuid
import logging
import json
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPClient, HTTPRequest

from easted.workorder import property as pro
from easted.workorder.constant import *
from easted.workorder.exception import *
from easted.core import dbpools
from easted.core import openstack

__UNINIT = -1
__CREATING = 0
__CREATE_SUCCESS = 1
__CREATE_FAILED = 2
__MOUNT_SUCCESS = 3
__MOUNT_FAILED = 4

__TYPE_VM = 0
__TYPE_VD = 1
__VM_INT_PRO = ("cores", "memory", "keepalive", "size", "create_policy")
__VM_DICT_PRO = ("network", "image", 'vminfo')
__STATUS_FIELD = "status"
__REMARK_FIELD = "remark"
__NAME_FIELD = "name"

LOG = logging.getLogger('system')


def __gen_header(method, token):
    hdr = {"Ecloud-Token": token}
    if method == "POST" or method == "PUT":
        hdr["Content-Type"] = "application/json"
    return hdr


@gen.coroutine
def async_request(url, token, body, method):
    try:
        hdr = __gen_header(method, token)
        if body:
            str_body = json.dumps(body)
        else:
            str_body = None
        req = HTTPRequest(url=url,
                          method=method,
                          headers=hdr,
                          body=str_body,
                          connect_timeout=200,
                          request_timeout=600,
                          validate_cert=False)
        LOG.debug("begin async_request, url = %s" % url)
        cli = AsyncHTTPClient()
        rep = yield cli.fetch(req)
        LOG.debug("end async_request")
        rs = json.loads(rep.body)
    except Exception, e:
        LOG.error("async_request failed: %s" % e)
        raise e
    raise gen.Return(rs)


def sync_request(url, token, body, method):
    hdr = __gen_header(method, token)
    if body is None:
        str_body = None
    else:
        str_body = json.dumps(body)
    req = HTTPRequest(url=url,
                      method=method,
                      headers=hdr,
                      body=str_body,
                      connect_timeout=200,
                      request_timeout=600,
                      validate_cert=False)
    cli = HTTPClient()
    rep = cli.fetch(req)
    return json.loads(rep.body)


@gen.coroutine
def insert(tx, woid, displayname, typ, pros):
    """
    insert resource related information
    """
    try:
        sql = "insert into resource(id, wo_id, displayname, type, status) values (%s, %s, %s, %s, %s)"
        res_id = str(uuid.uuid1())
        yield tx.execute(sql, [res_id, woid, displayname, str(typ), str(__UNINIT)])
        keys = pros.keys()
        for k in keys:
            yield pro.insert(tx, res_id, k, pros[k])
    except Exception, e:
        LOG.error("WorkOrder.resource.insert: %s" % e)
        raise e


@gen.coroutine
def get_resource(woid):
    """
    """
    db = dbpools.get_pool(dbpools.COMMON_DB)
    sql = "select * from resource where wo_id = %s"
    resources = []
    cur = yield db.execute(sql, [woid])
    if not cur:
        raise WorkOrderIdNotFoundException
    rs = cur.fetchall()
    for r in rs:
        res = dict()
        res["name"] = r["name"]
        res["displayname"] = r["displayname"]
        res["status"] = r["status"]
        res["id"] = r["id"]
        res["type"] = r["type"]
        res["uuid"] = r["uuid"]
        res["remark"] = r["remark"]
        pros = yield pro.get_pros(db, r["id"])
        for p in pros:
            if p['name'] in __VM_INT_PRO:
                res[p['name']] = int(p['value'])
            elif p['name'] in __VM_DICT_PRO:
                res[p['name']] = json.loads(p['value'])
            else:
                res[p['name']] = p['value']
        resources.append(res)
    raise gen.Return(resources)


@gen.coroutine
def __update_for_approving(tx, resid, uuid):
    sql = "update resource set uuid = %s, status = 0 where id = %s"
    try:
        yield tx.execute(sql,  (uuid, resid))
    except Exception, e:
        raise e


@gen.coroutine
def __update_for_approving_vm(tx, resid, name):
    sql = "update resource set name = %s, status = 0 where id = %s"
    try:
        yield tx.execute(sql, (name, resid))
    except Exception, e:
        raise e


@gen.coroutine
def __check_vm_exist(addr, token, res, res_id, db):
    try:
        url = addr + "/vm/%s" % res['vm_id']
        rs = yield async_request(url, token, None, 'GET')

        if rs['success']:
            vminfo = dict()
            vminfo['name'] = rs['result']['name']
            vminfo['displayname'] = rs['result']['metadata']['extend']['displayname']
            yield pro.insert(db, res_id, 'vminfo', json.dumps(vminfo))
            yield pro.insert(db, res_id, 'vm_id', res['vm_id'])
        else:
            LOG.debug("_check_vm_exist: %s" % rs['msg'])
            raise WorkOrderException(rs['msg'])
    except Exception, e:
        LOG.error("_check_vm_exist failed %s" % e)
        raise e


@gen.coroutine
def __create_vd(addr, token, wo_id, res, vd, params, db):
    try:
        body = dict()
        body["displayname"] = res['displayname']
        body['volume_type'] = str(vd['volume_type'])
        yield pro.insert(db, res['id'], 'volume_type', str(vd['volume_type']))
        body['des'] = params['des']
        body["size"] = res['size']
        body["user_id"] = str(params['user'])
        body["tenant_id"] = str(params['tenant'])
        body["order"] = wo_id

        rs = yield async_request(addr+'/volume', token, body, "PUT")

        if rs['success']:
            yield __update_for_approving(db, res['id'], rs['result']['id'])
        else:
            yield __update_field(res['id'], __REMARK_FIELD, rs['msg'])
            raise WorkOrderException(rs['msg'])
    except Exception, e:
        LOG.error("__create_vd failed: %s" % e)
        raise e


@gen.coroutine
def __create_vm(addr, token, wo, params, db):
    try:
        resid = wo['resources'][0]['id']
        vm = params['resources'][0]
        res = wo['resources'][0]
        body = dict()
        body["tenant"] = str(params['tenant'])
        if vm['host']:
            body["host"] = str(vm['host'])

        if vm['create_policy']:
            body['create_policy'] = int(vm['create_policy'])

        body["image"] = str(vm['image'])
        body["cores"] = int(res['cores'])
        body["memory"] = int(res['memory'])

        network = []
        for n in vm['network']:
            nw = dict()
            nw["vlan"] = str(n['vlan'])
            nw["ip"] = str(n['ip'])
            network.append(nw)
        body["network"] = network

        metadata = dict()
        metadata["sys_volume"] = {"type": str(vm['sys_volume'])}
        metadata["user"] = str(params["user"])
        metadata["order"] = str(wo['id'])
        metadata["extend"] = {"des": params['des'],
                              "keepalive": res['keepalive'],
                              "displayname":res['displayname']}
        metadata["super_user_pass"] = str(vm['super_user_pass'])
        body["metadata"] = metadata

        rs = yield async_request(addr+'/vm', token, body, "PUT")

        if rs['success']:
            yield __update_for_approving_vm(db, resid, rs['result']['name'])
            yield pro.insert(db, resid, "sys_volume", str(vm['sys_volume']))
            yield pro.insert(db, resid, "host", (vm['host']))
            for vd in wo['resources'][1:]:
                yield pro.insert(db, vd['id'], 'vm_id', '9999')
        else:
            yield __update_field(resid, __REMARK_FIELD, rs['msg'])
            raise WorkOrderException(rs['msg'])
        i = 1
        for vd in wo['resources'][1:]:
            try:
                yield __create_vd(addr, token, wo['id'], vd, params['resources'][i], params, db)
                i += 1
            except Exception, e:
                LOG.error("_create_vd failed: %s" % e)
                yield __update_field(vd['id'], __STATUS_FIELD, __CREATE_FAILED)
                i += 1
                continue
    except Exception, e:
        raise e


@gen.coroutine
def __check_image(addr, token, res, vm, db):
    try:
        url = addr + "/images?os=%s" % res['os']
        rs = yield async_request(url, token, None, 'GET')
        if not rs['success']:
            raise WorkOrderException(rs['msg'])

        image = {}
        for i in rs['result']:
            if i['id'] == vm["image"]:
                image["id"] = i["id"]
                image["name"] = i["name"]
                yield pro.insert(db, res['id'], "image", json.dumps(image))
                break
        if image == {}:
            raise WorkOrderImageNotFound
    except Exception, e:
        LOG.error("_check_image failed %s" % e)
        raise e


@gen.coroutine
def __check_network(addr, token, res, vm, db):
    try:
        network = list()
        for n in vm['network']:
            nw = dict()
            url = addr + "/network/%s" % n['vlan']
            rs = yield async_request(url, token, None, 'GET')
            if not rs['success']:
                raise WorkOrderException(rs['msg'])
            nw["vlan"] = {"id": str(n['vlan']), "name": rs['result'][0]["name"]}
            if n["ip"]:
                nw["ip"] = str(n["ip"])
            else:
                nw["ip"] = ""
            network.append(nw)
        if not network:
            raise WorkOrderNetWorkNotFound
        yield pro.insert(db, res['id'], 'network', json.dumps(network))
    except Exception, e:
        raise e


@gen.coroutine
def create(addr, token, wo, params):
    db = dbpools.get_pool(dbpools.COMMON_DB)
    try:
        tx = yield db.begin()
        res = wo['resources'][0]
        if wo['type'] == __TYPE_VD:
            yield __check_vm_exist(addr, token, params['resources'][0], res['id'], tx)
            yield __create_vd(addr, token, wo['id'], res, params['resources'][0], params, tx)
        elif wo['type'] == __TYPE_VM:
            vm = params['resources'][0]
            yield __check_image(addr, token, res, vm, tx)
            yield __check_network(addr, token, res, vm, tx)
            yield __create_vm(addr, token, wo, params, tx)
        else:
            raise WorkOrderUnknownType
        yield tx.commit()
    except Exception, e:
        yield tx.rollback()
        LOG.error("WorkOrder.resource.create: %s" % e)
        raise e


@gen.coroutine
def __update_field(resid, field, value):
    db = dbpools.get_pool(dbpools.COMMON_DB)
    try:
        if field is __STATUS_FIELD:
            sql = "update resource set status = %d where id = '%s'"
        elif field is __NAME_FIELD:
            sql = "update resource set name = '%s' where id = '%s'"
        else:
            sql = "update resource set remark = '%s' where id = '%s'"
        sql = sql % (value, resid)
        tx = yield db.begin()
        yield tx.execute(sql)
        yield tx.commit()
    except Exception, e:
        yield tx.rollback()
        raise e


@gen.coroutine
def __update_vm_uuid(resid, uuid):
    LOG.debug("__update_vm_uuid: begin")
    db = dbpools.get_pool(dbpools.COMMON_DB)
    LOG.debug("__update_vm_uuid: get db success")
    try:
        sql = "update resource set uuid = '%s' where id = '%s'"
        sql = sql % (uuid, resid)
        tx = yield db.begin()
        yield tx.execute(sql)
        yield tx.commit()
        LOG.debug("__update_vm_uuid: update success")
    except Exception, e:
        LOG.error("__update_vm_uuid: update failed")
        yield tx.rollback()
        raise e


@gen.coroutine
def attach(addr, token, resid, volume_id, vm_id):
    body = {"server_id": str(vm_id),
            "volume_id": str(volume_id)}
    LOG.debug("attach: begin")
    url = addr + "/volume/server/attach"
    try:
        rs = yield async_request(url, token, body, 'POST')
        if rs['success']:
            st = STATUS_COMPLETE
            yield __update_field(resid, __STATUS_FIELD, __MOUNT_SUCCESS)
        else:
            st = STATUS_FAILED
            yield __update_field(resid, __STATUS_FIELD, __MOUNT_FAILED)
            LOG.error(rs['msg'])
    except Exception, e:
        yield __update_field(resid, __STATUS_FIELD, __MOUNT_FAILED)
        LOG.error("attach failed: %s" % e)
    LOG.debug("attach: end")
    raise gen.Return(st)


@gen.coroutine
def __check_vd(url, res, token):
    LOG.debug("__check_vd: begin")
    if res['status'] != __UNINIT and res['status'] != __CREATING:
        LOG.debug("__check_vd: end")
        raise gen.Return(res['status'])

    url += "/volume/%s" % str(res['uuid'])
    rs = yield async_request(url, token, None, "GET")
    if not rs['success']:
        LOG.error("__check_vd failed: %s" % rs['msg'])
        yield __update_field(res['id'], __STATUS_FIELD, __CREATE_FAILED)
        yield __update_field(res['id'], __REMARK_FIELD, rs['msg'])
        LOG.debug("__check_vd: end")
        raise gen.Return(__CREATE_FAILED)

    st = rs['result']['status']
    LOG.debug("__check_vd status=%s" % st)
    if st == 'available':
        res_st = __CREATE_SUCCESS
        yield __update_field(res['id'], __NAME_FIELD, rs['result']['name'])
        yield __update_field(res['id'], __STATUS_FIELD, res_st)
    elif st == 'error':
        res_st = __CREATE_FAILED
        yield __update_field(res['id'], __STATUS_FIELD, res_st)
        yield __update_field(res['id'], __REMARK_FIELD, st)
    else:
        res_st = __CREATING
    LOG.debug("__check_vd: end")
    raise gen.Return(res_st)


@gen.coroutine
def __update_vm_pros(res, rs):
    LOG.debug("__update_vm_pros")
    db = dbpools.get_pool(dbpools.COMMON_DB)
    try:
        tx = yield db.begin()
        if not str(res['host']):
            yield pro.set_pro(tx, res['id'], 'host', str(rs['host']['name']))
        if not str(res['sys_volume']):
            yield pro.set_pro(tx, res['id'], 'sys_volume', str(rs['metadata']['sys_volume']['type']))

        network = list()
        for n in res['network']:
            nw = dict()
            nw['vlan'] = {"id": str(n['vlan']['id']), "name": str(n['vlan']['name'])}
            if n["ip"]:
                nw["ip"] = str(n["ip"])
            else:
                nw["ip"] = str(rs['network'][str(n['vlan']['name'])][0])
            network.append(nw)
        yield pro.set_pro(tx, res['id'], 'network', json.dumps(network))
        yield tx.commit()
        LOG.debug("__update_vm_pros: success")
    except Exception, e:
        LOG.debug("__update_vm_pros: failed")
        yield tx.rollback()
        raise e


@gen.coroutine
def __update_vm_id(res_id, vm_id):
    LOG.debug("__update_vm_id: begin")
    db = dbpools.get_pool(dbpools.COMMON_DB)
    try:
        tx = yield db.begin()
        yield pro.set_pro(tx, res_id, 'vm_id', vm_id)
        yield tx.commit()
        LOG.debug("__update_vm_id: success")
    except Exception, e:
        LOG.debug("__update_vm_id: failed")
        yield tx.rollback()
        raise e


@gen.coroutine
def __check_vm(wo, url, res, token):
    LOG.debug("__check_vm: begin")
    if res['status'] != __UNINIT and res['status'] != __CREATING:
        raise gen.Return(res['status'])

    url += "/vm/name/%s" % str(res['name'])
    rs = yield async_request(url, token, None, "GET")
    if not rs['success']:
        LOG.error("__check_vm failed: %s" % rs['msg'])
        yield __update_field(res['id'], __STATUS_FIELD, __CREATE_FAILED)
        yield __update_field(res['id'], __REMARK_FIELD, rs['msg'])
        LOG.debug("__check_vm: end")
        raise gen.Return(__CREATE_FAILED)

    if rs['result'] == {}:
        LOG.debug("__check_vm: call async_request result is {}")
        raise gen.Return(__CREATING)
    LOG.debug(json.dumps(rs))
    st = rs['result']['vm_state']
    LOG.debug("__check_vm status = %s" % st)
    if st == 'active':
        res_st = __CREATE_SUCCESS
        yield __update_vm_uuid(res['id'], rs['result']['id'])
        yield __update_vm_pros(res, rs['result'])
        for vd in wo['resources'][1:]:
            yield __update_vm_id(vd['id'], rs['result']['id'])

    elif st == 'building':
        raise gen.Return(__CREATING)
    else:
        yield __update_field(res['id'], __REMARK_FIELD, st)
        LOG.debug("__check_vm: end")
        res_st = __CREATE_FAILED
    yield __update_field(res['id'], __STATUS_FIELD, res_st)
    LOG.debug("__check_vm: end")
    raise gen.Return(res_st)


@gen.coroutine
def sync(wo, addr, res, token):
    LOG.debug("sync: begin")
    if res['status'] in [__CREATE_FAILED, __MOUNT_FAILED]:
        raise gen.Return(STATUS_FAILED)

    if res['type'] == __TYPE_VD:
        if res['status'] == __MOUNT_SUCCESS:
            raise gen.Return(STATUS_COMPLETE)

        st = yield __check_vd(addr, res, token)
        LOG.debug("resource.sync: %s" % st)
        if st == __CREATING:
            raise gen.Return(STATUS_WAIT)
        elif st == __CREATE_SUCCESS:
            raise gen.Return(STATUS_COMPLETE)
        else:
            raise gen.Return(STATUS_FAILED)
    elif res['type'] == __TYPE_VM:
        st = yield __check_vm(wo, addr, res, token)
        LOG.debug("resource.sync: %s" % st)
        if st == __CREATING:
            raise gen.Return(STATUS_WAIT)
        elif st == __CREATE_SUCCESS:
            raise gen.Return(STATUS_COMPLETE)
        else:
            raise gen.Return(STATUS_FAILED)
    else:
        raise WorkOrderUnknownType


@gen.coroutine
def set_timeout(wo):
    for r in wo['resources']:
        if r['status'] != __CREATING:
            continue
        yield __update_field(r['id'], __STATUS_FIELD, __CREATE_FAILED)
        yield __update_field(r['id'], __REMARK_FIELD, "message.work_order.approve_timeout")
