/*
 *
 * Create dist directory and sub-folders and copy necessary files from src
 * to dist.
 *
 */
let fs = require("fs");
let path = require("path");

if (!process.argv[2]) {
  console.error(`Invalid or missing base path: "${process.argv[2]}"`);
  process.exit(1);
}
if (!fs.existsSync(process.argv[2])) {
  console.error(`Base folder "${process.argv[2]}" doesn't exist.`);
  process.exit(2);
}

let dirs = {
  base: process.argv[2],
  src: {
    data: path.join(process.argv[2], "src/data"),
    log: path.join(process.argv[2], "src/log"),
    ssl: path.join(process.argv[2], "src/ssl"),
  },
  dist: {
    data: path.join(process.argv[2], "dist/data"),
    log: path.join(process.argv[2], "dist/log"),
    ssl: path.join(process.argv[2], "dist/ssl"),
  },
};

if (fs.existsSync(dirs.base)) {
  fs.mkdirSync(dirs.dist.data, { recursive: true });
  fs.mkdirSync(dirs.dist.log, { recursive: true });
  fs.mkdirSync(dirs.dist.ssl, { recursive: true });
  fs.copyFileSync(
    path.join(dirs.src.ssl, "ca.pem"),
    path.join(dirs.dist.ssl, "ca.pem")
  );
  fs.copyFileSync(
    path.join(dirs.src.ssl, "cert.pem"),
    path.join(dirs.dist.ssl, "cert.pem")
  );
  fs.copyFileSync(
    path.join(dirs.src.ssl, "key.pem"),
    path.join(dirs.dist.ssl, "key.pem")
  );
  fs.copyFileSync(
    path.join(dirs.src.data, "devices.json"),
    path.join(dirs.dist.data, "devices.json")
  );
  fs.copyFileSync(
    path.join(dirs.src.data, "channels.json"),
    path.join(dirs.dist.data, "channels.json")
  );
  fs.copyFileSync(
    path.join(dirs.src.data, "datapoints.json"),
    path.join(dirs.dist.data, "datapoints.json")
  );
  fs.copyFileSync(
    path.join(dirs.src.data, "rooms.json"),
    path.join(dirs.dist.data, "rooms.json")
  );
}
