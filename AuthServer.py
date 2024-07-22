from flask import Flask, request, redirect, jsonify
import requests
from urllib.parse import quote

app = Flask(__name__)

# Your Spotify App's Client ID and Client Secret
CLIENT_ID = 'bb3b242848014b628562e7992e4eee93'
CLIENT_SECRET = 'fb2b46242d5c4106a3347b3124c7b3a6'
# Ensure this redirect URI matches the one set in your Spotify app settings and is capable of handling the response
REDIRECT_URI = 'http://localhost:5001/callback'
# Update scope if necessary. This scope allows you to read the user's currently playing track
SCOPE = 'user-read-currently-playing'
AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'
# The Spotify Web API endpoint for fetching the currently playing track
CURRENTLY_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing'

@app.route('/')
def login():
    # Request authorization from the user
    auth_query_parameters = {
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
        "client_id": CLIENT_ID
    }
    url_args = "&".join(["{}={}".format(key, quote(val)) for key, val in auth_query_parameters.items()])
    auth_url = "{}/?{}".format(AUTH_URL, url_args)
    return redirect(auth_url)

@app.route('/callback')
def callback():
    # Spotify redirects the user back to this route with a code parameter
    code = request.args.get('code')
    # Exchange the code for an access token
    res = requests.post(TOKEN_URL, data={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    })
    token_info = res.json()
    access_token = token_info.get('access_token')

    # Use the access token to fetch the currently playing track
    print(access_token)
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(CURRENTLY_PLAYING_URL, headers=headers)
    print(response)
    # track_info = response.json()
    #
    # # Extract the album cover image URL
    # album_cover_url = track_info['item']['album']['images'][0]['url']
    #
    # # Return the album cover image URL or render it in a template
    # return jsonify({
    #     "album_cover_url": album_cover_url
    # })
    return "test"

if __name__ == "__main__":
    app.run(debug=True, port=5001)
