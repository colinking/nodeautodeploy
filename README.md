# Node Auto Deployment
This application can automatically update Node web servers from GitHub by listening for GitHub's webhooks for push events. This program runs an Express server that listens for these webhooks, and upon recieving one, will restart the PM2 process associated with the updated repo, download the new code and restart the server.

# Installation

1. You will first need to add a subdomain to your website where GitHub can attach the webhook. If you are using NGINX, you can add the following to your configuration to redirect all requests from a `deploy.*` subdomain to this Express app:
	```
	server {
	  listen 80;
	  server_name deploy.<DOMAINNAME>.com; // Replace with your domain
	  
	    location / {
	      proxy_pass http://127.0.0.1:3500; // Port 3500 is the default port used for this project 
	      proxy_http_version 1.1;
	      proxy_set_header Upgrade $http_upgrade;
	      proxy_set_header Connection 'upgrade';
	      proxy_set_header Host $host;
	      proxy_cache_bypass $http_upgrade;
	    }
	}
	```
2. Add a webhook for push events to your GitHub repository by going to Settings > Webhooks & Services > Add Webhook. 
	- Payload URL: Whatever you set as the URL above in your NGINX config (ex. "deploy.colinking.co"). 
	- Content Type: application/json
	- Secret: Set this to a random, high-entropy string. Save this for later, as it will be used to identify if a POST request to the above URL is from GitHub.
	- Events: Push events
	- Active: Yes
3. Clone this repo to your server.

	```
	git clone https://github.com/colinking/nodeautodeploy.git autodeploy
	cd autodeploy
	```
4. Store your secret Github token in your server's environment.

	```
	echo "export GH_WEBHOOK_SECRET='<GITHUB_SECRET>';" >> ~/.bash_profile
	```
5. Configure this program to know what repos and branches to watch for. The configuration is stored in `config/settings.json` and looks like this:

	```
	module.exports = {
		repos: {
			<repo_name>: {
				<branch_name>: {
					path: "<path_to_repo_directory>",
					pm2_id: "<pm2 id>"
				}
			}
		}
	}
	```
6. Run the Express app

	```
	pm2 start app.js --name deploy
	```
