#!/bin/bash
echo
echo "BEGIN SCRIPT"
echo

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

echo "MOVING '/HOUND_SERVER_DIR/Node/main/secrets/' INTO '/PARENT_DIR/'"
mv -f "${HOUND_SERVER_DIR}/Node/main/secrets/" "${PARENT_DIR}"

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
npm --prefix "${HOUND_SERVER_DIR}/Node/" i

echo "GRANTING R & W PRIVILEGES ON '/HOUND_SERVER_DIR/' (again)"
# Grant privileges AGAIN so that jxakellis has read/write privileges on node_modules folder
chmod -R a+rwx "${HOUND_SERVER_DIR}/"

echo "MOVING '/PARENT_DIR/secrets/' INTO '/HOUND_SERVER_DIR/Node/main/'"
mv -f "${PARENT_DIR}/secrets/" "${HOUND_SERVER_DIR}/Node/main/"

echo "MOVING '/HOUND_SERVER_DIR/Bash/cloneRepo.sh' INTO '/PARENT_DIR/' "
mv -f "${HOUND_SERVER_DIR}/Bash/cloneRepo.sh" "${PARENT_DIR}"

echo
echo "PM2"
echo

echo "STOPPING ALL PROCESSES"
pm2 stop all

echo "DELETING ALL PROCESSES"
pm2 delete all

echo "STARTING '/PARENT_DIR/Node/pm2.config.js'"
pm2 start "${PARENT_DIR}/Node/pm2.config.js"

echo "SAVING PROCESSES"
pm2 save --force

echo "WAITING FIVE SECONDS"
sleep 5

echo "LISTING PROCESSES"
pm2 list

echo
echo "END SCRIPT"
echo