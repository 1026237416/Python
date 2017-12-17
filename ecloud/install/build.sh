#!/bin/sh
package_name=easted_ecloud_enterprise


TOP_DIR=`pwd`
rm -rf target

cd ../code
sh build.sh
rm -rf ${TOP_DIR}/management/management/packages/ecloud/*
cp target/dist/*.tar ${TOP_DIR}/management/management/packages/ecloud/

cd ${TOP_DIR}
mkdir -p target/${package_name}

dir_path=(compute database management mongodb rabbitmq redis)
for dir in ${dir_path[@]}
do
	mkdir -p target/${package_name}/${dir}
	cd ${dir}

	tar czvf ${dir}.tar.gz ${dir}
	md5sum ${dir}.tar.gz > ${dir}.cs

	mv ${dir}.tar.gz ../target/${package_name}/${dir}
	mv ${dir}.cs ../target/${package_name}/${dir}
	cp install* ../target/${package_name}/${dir}

	cd ${TOP_DIR}
done

cd target 
tar czvf ${package_name}.tar.gz ${package_name}
