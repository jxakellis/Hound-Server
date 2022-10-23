#!/bin/bash
echo
echo "BEGIN SCRIPT"
echo

cd

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PARENT_DIR="${SCRIPT_DIR}/../../"
NODE_DIR="${PARENT_DIR}/Hound/Node/"

echo
echo "DIRECTORIES"
echo

echo "SCRIPT DIRECTORY: ${SCRIPT_DIR}"
echo "PARENT DIRECTORY: ${PARENT_DIR}"
echo "NODE DIRECTORY: ${NODE_DIR}"

echo
echo "DELETING"
echo

echo "MOVING '/NODE_DIR/main/secrets' INTO '/PARENT_DIR/'"
mv -f "${NODE_DIR}/main/secrets/" "${PARENT_DIR}"

echo "DELETING '/PARENT_DIR/Hound/'"
rm -rf "${PARENT_DIR}/Hound/"

echo
echo "CLONING"
echo

echo "CLONING UPDATED 'Hound' FROM GitHub"
git -C "${PARENT_DIR}" clone git@github.com:jxakellis/Hound-Server.git

echo "GRANTING R & W PRIVILEGES ON '/PARENT_DIR/Hound/'"
chmod -R a+rwx "${PARENT_DIR}/Hound/"

echo "INSTALLING node_modules IN /NODE_DIR/"
npm --prefix "${NODE_DIR}" i

echo "GRANTING R & W PRIVILEGES ON '/PARENT_DIR/Hound/' (again)"
# Grant privileges AGAIN so that jxakellis has read/write privileges on node_modules folder
chmod -R a+rwx "${PARENT_DIR}/Hound/"

echo "MOVING '/PARENT_DIR/secrets/' INTO '/NODE_DIR/main/'"
cp -rf "${PARENT_DIR}/secrets/" "${NODE_DIR}/main/"

echo
echo "PM2"
echo

echo "STOPPING ALL PROCESSES"
pm2 stop all

echo "DELETING ALL PROCESSES"
pm2 delete all

echo "STARTING '/NODE_DIR/pm2.config.js'"
pm2 start "${NODE_DIR}/pm2.config.js"

echo "SAVING PROCESSES"
pm2 save --force

echo "WAITING FIVE SECONDS"
sleep 5

echo "LISTING PROCESSES"
pm2 list

echo
echo "END SCRIPT"
echo