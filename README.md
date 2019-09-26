# [IconStory](https://iconstory.online)

[Live website](https://iconstory.online)

[Demo video](https://youtu.be/nnN_OijYp08)

[![IconStory Demo](https://img.youtube.com/vi/nnN_OijYp08/0.jpg)](https://youtu.be/nnN_OijYp08)

SCORE (Smart Contract) address: [cx3d3711258240fb4a00b940f9167da8d07ca050e1](https://tracker.icon.foundation/contract/cx3d3711258240fb4a00b940f9167da8d07ca050e1)

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

```sh
$ git clone https://github.com/penandlim/IconStory.git # or clone your own fork
$ cd IconStory
$ npm install
$ npm start
```

Your .env file should contain these settings.

```
URL=ICON_MAINNET_URL
SCORE=SCORE_ADDRESS
consumer_key=TWITTER_CONSUMER_KEY
consumer_secret=TWITTER_SECRET_KEY
access_token=TWITTER_ACCESS_TOKEN_KEY
access_token_secret=TWITTER_ACCESS_TOKEN_SECRET_KEY
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```
$ heroku create
$ git push heroku master
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Documentation

For more information about SCORE, ICON network, and ICX, you can refer to these documents below.

- [ICON Network URLs](https://github.com/icon-project/icon-project.github.io/blob/master/docs/icon_network.md)
- [SCORE quickstart](https://www.icondev.io/docs/score-quickstart)
- [Using T-Bears](https://www.icondev.io/docs/tbears-overview)
- [ICON SDKs](https://www.icondev.io/docs/sdk-overview)
- [ICONEX extensions](https://www.icondev.io/docs/chrome-extension-connect)
