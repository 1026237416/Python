import logging
import yaml


def log():
    return logging.getLogger('manor')


def is_acyclic(action):
    edge=action['stream_module']['edges']['_data']
    next_steps=[]

    def get_next(node):
        key=[_ for _ in edge.keys() if edge[_]['from']==node]
        if key:
            return edge[key[0]]['to']
        else:
            return None

    def check(node,root='root'):
        next=get_next(node)
        next_steps.append(next)
        log().debug('%s - %s'%(next,next_steps))
        if next:
            if root in next_steps:
                raise Exception('error.manor.template.action.is.acyclic')
            else:
                check(next,root)

    nodes=set(action['stream_module']['nodes']['_data'].keys())
    for n in nodes:
        next_steps=[]
        check(n,root=n)


def check_structure(action):
    log().debug(yaml.safe_dump(action))
    if 'stream_module' not in action:
        raise Exception('error.manor.template.no.stream_module')

    if 'streamlet' not in action:
        raise Exception('error.manor.template.no.streamlet')

    nodes=set(action['stream_module']['nodes']['_data'].keys())
    e_from=[action['stream_module']['edges']['_data'][_]['from'] for _ in
            action['stream_module']['edges']['_data'].keys()]
    e_to=[action['stream_module']['edges']['_data'][_]['to'] for _ in
          action['stream_module']['edges']['_data'].keys()]
    log().debug('from:%s'%str(e_from))
    log().debug('to:%s'%str(e_to))
    e_from+=e_to
    e_n=set(e_from)

    log().debug(nodes)
    log().debug(e_n)

    if nodes!=e_n:
        raise Exception('error.manor.template.nodes.not.match.edges')

    s_n=set(action['streamlet'].keys())
    s_n.add('start')

    log().debug(nodes)
    log().debug(s_n)

    if nodes!=s_n:
        raise Exception('error.manor.template.nodes.not.match.streamlet')
