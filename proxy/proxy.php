<?php
/*	
	A basic PHP script that fetches a favicon and returns 
	its base64 encoded string. This is a part of the accentColor script
	(www.joelb.me/accentcolor) by Joel Besada. 

    Connects to http://g.etfv.co/ (getFavicon by Jason Cartwright) to get favicons. 
    Uses Diogo Resende's ICO converter to convert ICO to PNG. (Needed by IE)
	
	Author: Joel Besada (http://www.joelb.me)
	Date: 2011-12-10

	Copyright 2011, Joel Besada
	MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
*/

define("FAVICON_RETRIEVER", "http://g.etfv.co/%s?defaulticon=none");
require("class.ico.php");

try {
	// Make sure the URL is set
	if(isset($_GET["url"])) {
		
		// Set text header
		header('Content-type: text/plain');
		
		// Get the decoded version of the URL
		$url = urldecode($_GET["url"]);

		// Insert HTTP protocol if http or https is not supplied 
		if (strpos($url, "http") === false) {
			$url = "http://" . $url;
		}

		// Create the favicon URL and get the contents from it 
		$favURL = sprintf(FAVICON_RETRIEVER, $url);

		// Load contents
		$file = @file_get_contents($favURL);

		// If favicon could be retrieved
		if($file !== false && strlen($file) > 0) {
			// Since IE does not support base64 encoded ICO files,
			// we need to convert them to PNGs

			// Check the header, only ICO files should
			// start with 0,0
			$signature = unpack("S2", $file);
			if($signature[0] == 0 && $signature[1] == 0) {

				// Create the ICO 
				$ico = new Ico();
				$ico->LoadData($file);

				// Get the image resource
				$res = $ico->GetIcon(0);

				// Since imagepng outputs the data directly, 
				// we need to start the output buffering, capture
				// the contents in a variable, and end the buffering
				ob_start(); 
				imagepng($res); 
				// Get the data string
				$file = ob_get_contents(); 
				ob_end_clean(); 
				
				// Destroy the image
				imagedestroy($res);
			}

			// Create the base64 string 
			$base64 = @base64_encode($file);
			// Return the data
			echo $base64;

		// Failed to get favicon
		} else {
			header('HTTP/1.0 502 Bad Gateway');
			echo "Could not load favicon from URL: " . $url;
		}

	// Missing URL parameter
	} else {
		header('HTTP/1.0 400 Bad Request');
		echo "URL was not specified";
	}

// Any other exception
} catch (Exception $e) {	
	header('HTTP/1.0 500 Internal Server Error');
	echo "Internal Server Error";
}

?>