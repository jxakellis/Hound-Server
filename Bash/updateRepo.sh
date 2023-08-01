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
echo "UPDATING REPOSITORY"
echo

echo "PULLING LATEST FROM 'Hound-Server' IN '/PARENT_DIR/'"
git -C "${HOUND_SERVER_DIR}" pull origin main

echo "INSTALLING node_modules IN /HOUND_SERVER_DIR/Node/"
npm --prefix "${HOUND_SERVER_DIR}/Node/" ci

# chmod "${BASH_SOURCE[0]}" is used to ensure that the script itself has permissions
echo "GRANTING PERMISSIONS FOR THIS SCRIPT"
chmod a+rwx "${BASH_SOURCE[0]}"

echo "GRANTING PRIVILEGES FOR '/HOUND_SERVER_DIR/'"
chmod -R a+rwx "${HOUND_SERVER_DIR}/"

echo "MOVING '/HOUND_SERVER_DIR/Bash/' INTO '/PARENT_DIR/' "
mv -f "${HOUND_SERVER_DIR}/Bash/" "${PARENT_DIR}"

echo
echo "PM2"
echo

echo "STOPPING ALL PROCESSES"
pm2 stop all

echo "DELETING ALL PROCESSES"
pm2 delete all

echo "STARTING '/HOUND_SERVER_DIR/Node/pm2.config.js'"
pm2 start "${HOUND_SERVER_DIR}/Node/pm2.config.js"

echo "SAVING PROCESSES"
pm2 save --force

echo "LISTING PROCESSES"
pm2 logs
