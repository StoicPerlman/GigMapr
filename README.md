# GigMapr
Author: Sam Kleiner
#### GigMapr.com

---

#### Config
- Install docker
- Optional: Fill in Indeed PUBLISHER_ID in indeed-node/indeed-config.js (or set during docker run later)

---

#### Run
```sh
$ git pull https://github.com/StoicPerlman/GigMapr
$ cd GigMapr
$ docker build -t gigmapr:latest .
$ docker run -it --rm -p 80:3000 -e INDEED_PUB=0000000000000000 gigmapr
```

---

> Note: This site uses the indeed.com API. I am in no way associated with indeed.com.

Check out the original project GigMapr-R https://github.com/StoicPerlman/GigMapr-R
