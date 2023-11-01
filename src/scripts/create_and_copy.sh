mkdir -p $1/dist/data
mkdir -p $1/dist/log
mkdir -p $1/dist/ssl
cp -u $1/src/ssl/ca.pem $1/dist/ssl
cp -u $1/src/ssl/cert.pem $1/dist/ssl
cp -u $1/src/ssl/key.pem $1/dist/ssl
cp -u $1/src/data/devices.json $1/dist/data
cp -u $1/src/data/channels.json $1/dist/data
cp -u $1/src/data/datapoints.json $1/dist/data
cp -u $1/src/data/rooms.json $1/dist/data