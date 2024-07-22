import requests
from PIL import Image
from collections import Counter
from io import BytesIO
import time
from govee_api_ble import GoveeDevice

#my_device = GoveeDevice(FA:KE:MA:CH:ER:E0)

# Replace this URL with your actual Node.js server URL

def get_dominant_color(image_url, resize_width=100):
    # Fetch the image
    response = requests.get(image_url)
    
    # Open the image from bytes
    image = Image.open(BytesIO(response.content))
    
    # Optional: Resize the image to speed up processing
    # Keep aspect ratio
    image = image.resize((resize_width, int((image.height / image.width) * resize_width)))
    
    # Convert the image to RGB (if not already in that format)
    image = image.convert('RGB')
    
    # Get colors from image
    colors = image.getcolors(image.width * image.height)
    
    # Flatten the list of colors and counts
    all_colors = [color for count, color in colors for _ in range(count)]
    
    # Use Counter to find the most common color
    most_common_color = Counter(all_colors).most_common(1)[0][0]
    
    return most_common_color


url = 'http://localhost:5002/album-cover'
while True:
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        album_cover_url = data.get('albumCoverUrl', 'No album cover URL found')
        print("Album cover URL:", album_cover_url)
        dominant_color = get_dominant_color(album_cover_url)
        print(f"Dominant Color: {dominant_color}")
    else:
        print("Failed to retrieve album cover URL. Status code:", response.status_code)
    time.sleep(1)


