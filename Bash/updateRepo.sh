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

echo "DISCARDING LOCAL CHANGES TO REPO"
git -C "${HOUND_SERVER_DIR}" reset --hard

echo "PULLING LATEST FROM 'Hound-Server/Node' IN '/PARENT_DIR/'"
git -C "${HOUND_SERVER_DIR}" pull origin main

echo "INSTALLING node_modules IN /HOUND_SERVER_DIR/Node/"
npm --prefix "${HOUND_SERVER_DIR}/Node/" ci

# chmod "${BASH_SOURCE[0]}" is used to ensure that the script itself has permissions
echo "GRANTING PERMISSIONS FOR THIS SCRIPT"
chmod a+rwx "${BASH_SOURCE[0]}"

echo "GRANTING PRIVILEGES FOR '/HOUND_SERVER_DIR/'"
chmod -R a+rwx "${HOUND_SERVER_DIR}/"

echo "MOVING '/HOUND_SERVER_DIR/Bash/*' INTO '/PARENT_DIR/' "
# When you include the * wildcard character inside quotes, bash doesn't expand it. So, bash is trying to find a file literally named *, which of course doesn't exist.
mv -f ${HOUND_SERVER_DIR}/Bash/* "${PARENT_DIR}"

echo
echo "REMOVING LARGE LOG FILES"
echo

LOG_DIR="${HOUND_SERVER_DIR}/Node/logs"
# 10 MB
LOG_SIZE_LIMIT=$((1024 * 1000 * 10))

# Loop through each log file in the directory
for log_file in "${LOG_DIR}"/*; do
    # Capture the size of the file
    file_size=$(stat -c%s "$log_file")

    echo "${file_size}"

    # Check if the file size is greater than the size limit
    if [ ${file_size} -gt ${LOG_SIZE_LIMIT} ]; then
        echo "File ${log_file} is larger than ${LOG_SIZE_LIMIT} bytes (Actual size: ${file_size} bytes)"

        rm "${log_file}"
    fi
done

echo
echo "LARGE LOG FILE MANAGEMENT COMPLETED"
echo

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
