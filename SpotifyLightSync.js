require('dotenv').config();
const cors = require('cors');
const express = require('express');
const request = require('request');
const app = express();
const port = 5002;

let lastAccessToken = null;
let lastAlbumCoverUrl = null;
let lastFetchedAlbumCoverUrl = null;
let lastRefreshToken = null; // Add this line
let accessTokenExpiresAt = 0; // Add this line


const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const redirect_uri2 = process.env.REDIRECT_URI2;
// Step 1: Have your application request authorization
app.use(express.static('public'));
app.use(cors());

async function openSpotifyAuthPage(url) {
    try {
        console.log("try");
      const open = await import('open');
      open.default(url); // For ES modules imported dynamically
    } catch (error) {
      console.error('Failed to open Spotify authentication page:', error);
    }
  }

  async function fetchCurrentPlaying() {
    const accessToken = await getAccessToken(); // Make sure you have a function to get a valid access token
    const options = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: { 'Authorization': 'Bearer ' + accessToken },
        json: true
    };

    request.get(options, (error, response, body) => {
        if (!error && response.statusCode === 200 && body.item) {
            const albumCoverUrl = body.item.album.images[0].url;
            if (albumCoverUrl !== lastFetchedAlbumCoverUrl) {
                console.log('New song detected, updating album cover URL.');
                lastFetchedAlbumCoverUrl = albumCoverUrl;
            }
        }
    });
}

// Set an interval to check every minute
setInterval(fetchCurrentPlaying, 1000);
  
function refreshAccessToken() {
  return new Promise(function(resolve, reject) {
    if (!lastRefreshToken) {
      reject(new Error('No refresh token'));
    } else {
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
          grant_type: 'refresh_token',
          refresh_token: lastRefreshToken
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          lastAccessToken = body.access_token;
          let expiresIn = body.expires_in;
          accessTokenExpiresAt = new Date().getTime() + expiresIn * 1000;
          lastRefreshToken=body.refresh_token;
          resolve(lastAccessToken);
        } else {
          reject(new Error('Failed to refresh access token'));
        }
      });
    }
  });
}
  
  async function getAccessToken() {
    // Check if the current access token is expired
    if (Date.now() >= accessTokenExpiresAt) {
      console.log('Access token expired, refreshing...');
      await refreshAccessToken();
    }
    return lastAccessToken;
  }
  

  app.get('/', function(req, res) {
    const scope = 'user-read-currently-playing';
    res.redirect('https://accounts.spotify.com/authorize?' +
      new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
      }));
  });


// Step 2: Have your application request refresh and access tokens
app.get('/callback', function(req, res) {
  const code = req.query.code || null;

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      const refresh_token = body.refresh_token; // Spotify sends this along with access_token
    const expires_in = body.expires_in;
      lastAccessToken = access_token; // Store the access token for later use
      hToken = refresh_token; // Save the refresh token
    accessTokenExpiresAt = Date.now() + expires_in * 1000;
  
      const options = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };
  
      // Use the access token to access the Spotify Web API
      request.get(options, function(error, response, body) {
        console.log(body);
        //Extract the album cover image URL and save it
        if (body && body.item && body.item.album && body.item.album.images[0]) {
          lastAlbumCoverUrl = body.item.album.images[0].url;
        }
        
        // You could send the album cover URL as a response here, or just confirm success
        res.send({ albumCoverUrl: lastAlbumCoverUrl });
      });
  
    } else {
      res.status(400).send('Error getting access token');
    }
  });
  
});
  
app.get('/album-cover', (req, res) => {
    if (!lastFetchedAlbumCoverUrl) {
      return res.status(404).send('No album cover URL found.');
    }
    res.json({ albumCoverUrl: lastFetchedAlbumCoverUrl });
  });
  
  

app.listen(port, () => {
    openSpotifyAuthPage(`http://localhost:${port}/`);
  console.log(`Listening on port ${port}`);
});
