#!/bin/bash
echo
echo "BEGIN SCRIPT"
echo

set -ef

cd

PARENT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
HOUND_SERVER_DIR="${PARENT_DIR}/Hound-Server/"

echo
echo "DIRECTORIES"
echo

echo "PARENT DIRECTORY: ${PARENT_DIR}"
echo "HOUND SERVER DIRECTORY: ${HOUND_SERVER_DIR}"

echo
echo "DELETING"
echo

echo "MOVING '/HOUND_SERVER_DIR/Node/src/main/secrets/' INTO '/PARENT_DIR/'"
rm -rf "${PARENT_DIR}/secrets/"
mv -f "${HOUND_SERVER_DIR}/Node/src/main/secrets/" "${PARENT_DIR}"

echo "DELETING '/HOUND_SERVER_DIR/'"
rm -rf "${HOUND_SERVER_DIR}"

echo
echo "CLONING"
echo

echo "CLONING 'Hound-Server' INTO '/PARENT_DIR/'"
git -C "${PARENT_DIR}" clone git@github.com:jxakellis/Hound-Server.git

echo "GRANTING R & W PRIVILEGES ON '/HOUND_SERVER_DIR/'"
chmod -R a+rwx "${HOUND_SERVER_DIR}/"

echo "INSTALLING node_modules IN /HOUND_SERVER_DIR/Node/"
npm --prefix "${HOUND_SERVER_DIR}/Node/" ci

echo "GRANTING R & W PRIVILEGES ON '/HOUND_SERVER_DIR/' (again)"
# Grant privileges AGAIN so that jxakellis has read/write privileges on node_modules folder
chmod -R a+rwx "${HOUND_SERVER_DIR}/"

echo "MOVING '/PARENT_DIR/secrets/' INTO '/HOUND_SERVER_DIR/Node/src/main/'"
rm -rf "${HOUND_SERVER_DIR}/Node/src/main/secrets/"
mv -f "${PARENT_DIR}/secrets/" "${HOUND_SERVER_DIR}/Node/src/main/"

echo "MOVING '/HOUND_SERVER_DIR/Bash/*' INTO '/PARENT_DIR/' "
# When you include the * wildcard character inside quotes, bash doesn't expand it. So, bash is trying to find a file literally named *, which of course doesn't exist.
mv -f ${HOUND_SERVER_DIR}/Bash/* "${PARENT_DIR}"

echo
echo "PM2"
echo

echo "STOPPING ALL PROCESSES"
pm2 stop all

echo "DELETING ALL PROCESSES"
pm2 delete all

echo "STARTING '/HOUND_SERVER_DIR/Node/pm2.config.cjs'"
pm2 start "${HOUND_SERVER_DIR}/Node/pm2.config.cjs"

echo "SAVING PROCESSES"
pm2 save --force

echo "LISTING PROCESSES"
pm2 logs
