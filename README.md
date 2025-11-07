# Music Found

## Original Concept
I did a quick little project back when learning web development, from Brad Traversy. I loved it. It was a simple page that played a audio file. I went on to add a few things. Loved a song on SoundCloud and that was the one I used. Linked it and passed credit. Record player spinning in the background. It was great. Here is the live version of that project if you like: [Music Found](https://cocky-cori-7cae1e.netlify.app/).

![app index](./public/Screenshot%20from%202025-11-07%2014-21-09.png)

## Introduction
This has been a idea for some time that is finally getting some traction. I wanted a app that was similar to my Microsoft Zune. I also love the SoundCloud waveform. This app is very different from other music apps in that I am not using a API for streaming. Rather I am making my own. This is strictly to enjoy your own music. You have to own the music files and upload them to your account. The app will allow you to customize you music experience in a few ways. Images, short video, managing metadata, and EQ. I loved my Zune, but there was also a player called [AIMP](https://www.aimp.ru/) that allowed for player customization and managing of metadata that was wonderful.

Pat of this app is part of my portfolio, built on Rails using a PostgreSQL database. The large image and audio files are stored in a S3 bucket. This allows me to host it on Heroku for under $20 a month while having access to those files. The player uses the [WaveSurfer](https://wavesurfer.xyz/examples/?basic.js) javascript library through the Rails Stimulus system. It takes into account that the player is working with S3.

## Home Screen
![app index](./public/Screenshot%20from%202025-04-25%2016-23-40.png)

## Player Screen v1
![Player](./public/Screenshot%20from%202025-05-01%2011-53-09.png)

## Player Screen v2
![player v2](./public/Screenshot%20from%202025-05-09%2014-00-14.png)

## Player Screen v3
![player v3](./public/Screenshot%20from%202025-10-07%2017-50-31.png)

This is still very much a work in progress. Currently there is a guest view that allows you two view music files and includes the player as you see in v3. It includes Hotwire as well which is coming along nicely. I love that React feel with the ease of Rails. You can create an account as a user. This allows for the video content to be shown. There is a option to show video if it is available, or just the image. The guests do not have this option. The mobile player is completely functional today as well and is pretty nice on my phone. A user can upload there mp3, images and video. Currently you can only do one track at a time. The models and associations are in place for bulk, I just have not got there yet. Admin has full CRUD over guest music and can hide or show tracks. Users can not make their music public. This was done so I could show case the player. Walking the line on music rights here. 

* Ruby version 3.3.7

* Rails version 8.0.1

* System dependencies

* Configuration


* Database creation
Typical for PostgreSQL. I set up host, username: (default for PG), password: (default for PG), for my local setup.

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

True Browser Fullscreen: Using Fullscreen API to hide browser chrome
Mobile Gestures: Swipe left/right for next/previous tracks
Media Session API: Lock screen controls and notification integration
Landscape Mode Optimization: Different layouts for orientation changes
PWA Features: Offline capabilities and app-like installation
