# get-me-through
A **Free, Offline,Real-Time, Open-source** web-app to assist organisers of an event to allow only authorised/invited people using `Face-Recognition Technology` or `QR Code`.

The name of the project is just an exclamation to steer through the monotonous work, in today's world of spreading automation technology. The face recognition is built using dlib's pretrained model with
99.38% accuracy. See [this](https://github.com/ageitgey/face_recognition#face-recognition) for more info. 

One more important thing: *The face recognition model is trained on adults and does not work very well on children. It tends to mix up children quite easy using the default comparison threshold of 0.6.*. If you have children as a part of the audience you may use the QR Code or may change the comparison threshold if that fulfills your requirement.

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

The project requires a few dependencies, so patience is a virtue.
If you are using `anaconda` I would recommend to uninstall it. It is because there is some issue in installing dlib with that.
Probably related to Python path or something else. If you can handle it then go on.

### Prerequisites
* Python3
* Node.js v8.1.4 or later
* MongoDB
* macOS( Tested),Linux( Working), Windows( Untested)
* C++11 or later

### Installing
1.) I would recommend to create a `Python3` virtual environment with the name `get-me-through`.
[A good guide for creating virtual env in python3](https://www.digitalocean.com/community/tutorials/how-to-install-python-3-and-set-up-a-local-programming-environment-on-ubuntu-16-04).
**Activate** the virtual environment.

2.) Download the [face_recognition](https://github.com/ageitgey/face_recognition) python package(Details included).
 This is the crux of the whole project. It would take some time. If you face some difficulty in downloading `dlib` @ageitgey has
provided some info(there is pre-configured VM image also but I have not tried it), if that even doesn't help you may see: [How to install dlib](http://www.pyimagesearch.com/2017/03/27/how-to-install-dlib/) <- *I followed this*.

3.) Download OpenCV3. If you are on Mac/Linux you may find this helpful: 
[Install OpenCV3 on MacOS](http://www.pyimagesearch.com/2016/12/19/install-opencv-3-on-macos-with-homebrew-the-easy-way/) <- *I followed this*.[**Update 30/3/2018: If you are not able to import cv2(OpenCV3) please see issue#7**]

4.) Congrats if you made it to this step. Now you can just Download or clone my git repository code in the virtual environment and make sure
it looks like this:
![file structure](https://user-images.githubusercontent.com/13511528/28489848-6186535a-6eea-11e7-8886-2a8349d83973.png)

5.) Now you may download [Node.js](https://nodejs.org/en/download/) and [MongoDB](https://www.mongodb.com/) if you don't have it already.

6.) Now do `npm install` on the command line, make sure you do in the root of the project such that `package.json` file is visible on doing `ls`.

7.) **Please see the below section of "How to use" before following this step.** To run it: `npm start`, for development purpose use `npm test` after installing `nodemon` and after you see `Server listening on port: 3000.` open your browser and type: `localhost:3000` and it's done. 
You would be greeted by something like this(I am not good at Front-End so please bear with me):
![start](https://user-images.githubusercontent.com/13511528/28490748-5240823e-6eff-11e7-9776-25b5d633425d.png)


## How to use
### BoilerPlate
The model expects a folder named `known_people` to have all the images of person you want to recognise with the name of person as the file name.

For ex: If you want to recognise `Narendra Modi`, you would name the file as `Narendra Modi.jpg`.

The model learn encodings and want a folder named `data` to store the learnt encodings there. **You have to make this folder on your own.**
Just do `mkdir data` and that's it. 

One another thing: You would have a folder named `bin` in the root of this project(if not create one using `mkdir bin`). Go into `bin` folder and paste this file: [www](https://gist.github.com/malikshubham827/439cec7df328b12b1a40dcab550aef20). This file should have no extension. It is important as `npm start` invokes this file to set-up the web-server.

### MongoDB Database Support
The project also supports **MongoDB** support builtin. If you have many entry gates/systems you may synchronise them with a cloud database
like [mLab](https://mlab.com/) (but it would require **Internet Connection** and may cause latencies). You just have to change one single line in the file `/server/db/db.js` to 

`mongoose.connect('mongodb://yourCloudDBLink/GetMeThrough',{ useMongoClient: true });`. For users who want to use local MongoDB db, may start it
and change the link if required, by default port is `27017`.

### UI
All the buttons have `tooltips` to help you here is a little summary:
* **TRAIN**: Train the model to learn the images
* **CLEAR MODEL**: Deletes the files in the `data` folder so the model is as fresh as it's running for first time. Usefull for a new event.
* **RUN**: Runs the model to start the Face Recognition(Python child process) inside Node.js web-server
* **STOP**: Stops the model.
* **HALT**: The model **keeps running in background**, but live updates about the people is not shown to the user. *Usecase*: It is useful
in case the model doesn't verify the person correctly and QR Code authentication is required. Halt the model,scan QR Code by clicking
on the QR Code icon. If the color of text of item turns green the person is authenticated if red the person is not authenticated.
* **In**: If the operator of software wants to log the visitors `arriving` to the event.(defualt)
* **Out**: If the operator of software wants to log the visitors `leaving` the event.

A sample output of the web-app:
![auth output](https://user-images.githubusercontent.com/13511528/28490896-db9efec2-6f02-11e7-85f3-dbe591e270cc.png)

The left `correct/tick` means the person is recognised by face owing to his/her image in `known_image` folder.

The next icon is the `QR Code` icon meant to be used in case the authentication is not complete or the face is not identified.

The color of element having the name of the person shows the status of authentication. `Barack Obama` has photo in `known_people` folder
and a record in `MongoDB` database, whereas I have only put my image in `known_people` folder but not put the record in the Database so
that's why it is showing red color. Thus it is capable( I tried my best) of **2 step authentication**. 
It also has the ability to be extended to **3 step authentication** as it provides the data of person identified. You may ask him to 
verify the details for an *extra layer of security* as shown below.

![3 step auth](https://user-images.githubusercontent.com/13511528/28490960-2970618a-6f04-11e7-9125-d1167e3afb22.png)

At the top of description is a little message owing to the real-time status. Have a look at code to customise/understand.
Every property is self explanatory except `Permission`. This yours truly have added in case there is some criteria specified by your organisation
as an important thing to be done to become elegible. It can be like downloading certain Apps, Signing up for a service/Create a new account,
email verification, phone verification etc. You are free to customize it. If you change it please have a look at `server/auth/auth.js` and see if it 
needs modifications also to cater to your needs.

**I think if you are desperate enough, you would like to play around with it, to explore it, improve it and find the shortcomings** .
If you have any doubts ask me in the issues area.

## Built with
* [Python3](https://www.python.org/) - de facto ML language(I think) used to write face recognition script
* [dlib](http://dlib.net/) - Used for trained facial features and encodings
* [face_recognition](https://github.com/ageitgey/face_recognition) - a nice user friendly python3 package to work with dlib
* [MaterializeCSS](http://materializecss.com/) - Used as front-end material framework
* [Node.js](https://nodejs.org/) - Used for back-end web-server
* [Express.js](https://expressjs.com/) - Used as web-application framework
* [Socket.IO](https://socket.io/) - Used as real-time engine for communication between front-end and back-end

## Contributing
The project is not complete and it is not intended to be. It is made to be built upon as per needs. Do contribute, fork it, star it
if you like it.

A lot of features can be added, glimpse of few:
* Add the captured video stream via OpenCV in the web-app to prevent the user from switching between tabs.
* Add a service to send notification to user regarding their visit, like email, SMS so they know if someone has used their identity.
* Make another web-app or integrate in it to allow user to register, upload pics, get QR Code(QR Code generation script ready, test passed)
* Add a feature to allow the user to choose camera of their choice like external web-cam, phone camera. Currently using builtin laptop front facing camera.
* Performance improvements. Test on large no. of people in real life situation.
* As the model is trained on adults, it might mixup the children. So there should be a button to revoke the entry and reset that particular record. Maybe the child of face is recognised same as that of his parents, so that means 2 people with same face/entry. In that case revoke the entry of child and use QR Code. Or you may hack around it too :bowtie:.

## Author
* Shubham Malik
Thanks for listening to my musings so far.

You can connect with [me](http://shubhammalik.xyz).

Read my medium [post](https://medium.com/@malikshubham827/offline-real-time-face-recognition-in-node-js-using-python-atop-99-38-accuracy-model-9f0f46d6a88d) regarding my experience building it. 9 mins only, take a cup of coffee and enjoy(I tried my best) it (gifs included).

## License
This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/malikshubham827/get-me-through/blob/master/LICENSE.md) file for details

## Acknowledgements
* Thanks to [schmich](https://github.com/schmich) for creating [Instascan](https://github.com/schmich/instascan)
* [npm](http://npmjs.com/) community for awesome packages
* [@sahildua2305](https://twitter.com/sahildua2305) my senior for inspiring [article](https://hackernoon.com/unconventional-way-of-learning-a-new-programming-language-e4d1f600342c)
