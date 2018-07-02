#!/bin/bash

if [ $# -ne 1 ]; then
	echo "Usage: $0 <main|beta|help>"
	exit 1
fi

if [ $1 = "main" ]; then
	echo "Pushing to main website"
	scp -r ./game ./index.html samson@samsonclose.me:/var/www/html/space
	scp -r ./game/server ./game/shared samson@samsonclose.me:/home/samson/servers/space
	ssh root@samsonclose.me 'systemctl restart space'
elif [ $1 = "beta" ]; then
	echo "Pushing to beta website"
	sudo scp -r ./game ./index.html samson@samsonclose.me:/var/www/html/space/beta
	scp -r ./game/server ./game/shared samson@samsonclose.me:/home/samson/servers/space-beta
	ssh root@samsonclose.me 'systemctl restart space-beta'
elif [ $1 = "help" ]; then
	echo "Usage: $0 <main|beta|help>"
	exit 1
fi
