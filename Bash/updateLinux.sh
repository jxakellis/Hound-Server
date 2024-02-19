#!/bin/bash
echo
echo "BEGIN SCRIPT"
echo

echo
echo "UPDATING"
echo

sudo apt-get update

echo
echo "UPDATING"
echo

sudo apt-get upgrade

echo
echo "UPDATING DIST"
echo

sudo apt-get dist-upgrade

echo
echo "REBOOTING"
echo

sudo reboot

echo
echo "END SCRIPT"
echo