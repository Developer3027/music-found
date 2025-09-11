# Music Found

I did a quick little project back when learning web development, from Brad Traversy. I loved it. It was a simple page that played a audio file. I went on to add a few things. Loved a song on SoundCloud and that was the one I used. Linked it and passed credit. Record player spinning in the background. It was great. Here is the love version of that project if you like: [Music Found](https://cocky-cori-7cae1e.netlify.app/).

This has been a idea for some time that is finally getting some traction. It is built as part of MILK-00, my personal site to show my work and something for me to enjoy. I wanted a app that was similar to my Microsoft Zune. I also love the SoundCloud waveform. This app is very different from other music apps in that I am not using a API. Rather I am making my own. This is strictly to enjoy your own music. You have to own the music files and upload them to your account. The app allows you to customize you music experience in a few ways. Images, short video, managing metadata, and EQ. I loved my Zune, but there was also a player called [AIMP](https://www.aimp.ru/) that allowed for player customization and managing of metadata that was wonderful.

This app is built on Rails using a PostgreSQL database. The large image and audio files are stored in a S3 bucket. This allows me to host it on Heroku for under $20 a month while having access to those files. The player uses the [WaveSurfer](https://wavesurfer.xyz/examples/?basic.js) javascript library through the Rails Stimulus system. It takes into account that the player is working with S3.

## Home Screen
![app index](./public/Screenshot%20from%202025-04-25%2016-23-40.png)

## Player Screen v1
![Player](./public/Screenshot%20from%202025-05-01%2011-53-09.png)

## Player Screen v2
![playerv2](./public//Screenshot%20from%202025-05-09%2014-00-14.png)

New UI with version two. For desktop and tablet, mobile is not built yet, features a sidebar for main navigation. The main banner image changes with selection including the title and subtitle with Stimulus. Turbo frames are used for main navigation to give the spa vibe.

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

