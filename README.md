# Acrolinx Sidebar Demo

Demo code for an integration of the Acrolinx sidebar into a web application

## Prerequisites

Please contact your technical Acrolinx contact to get initial consulting.... 
(TODO: Write nice text)
You will get all required configuration settings after that meeting.

## Configuration of the sidebar cloud example

Before you can run this example you need to configure some settings in these files:

  * server/cloud/config.js
    * username
    * password
    * clientId
    * clientSecret
  * client/cloud/config.js
    * documentId

## Configuration of the sidebar on premise example

Before you can run this example you need to configure some settings in these files:
  * client/on-premise/example.js
    * clientSignature

    You can change the default Acrolinx server address.


## How to start
First make sure, that you have installed nodejs (which includes npm) and grunt-cli.

Then you need to install all required node modules:

    npm install

Now you can start the development server by typing:

    grunt

(If grunt complains while the bower:install task, you might have to execute "bower install" manually.)

Now open [http://localhost:9002](http://localhost:9002) in your web-browser.


## License

Copyright 2015 Acrolinx GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

For more information visit: http://www.acrolinx.com


