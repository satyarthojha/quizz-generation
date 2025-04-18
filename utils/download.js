



const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execAsync = promisify(exec);

const downloadAudio = async (videoUrl, outputDir = './public') => {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract video ID for unique filename
    const videoId = videoUrl.match(/(?:\?v=|\/)([0-9A-Za-z_-]{11})/)?.[1] || Date.now();
    const outputPath = path.join(outputDir, `${videoId}.mp3`);

    // Clean up any existing file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    // Download command with flags to prevent caching/reuse
    const command = `yt-dlp -x --audio-format mp3 --no-continue --force-overwrites -o "${outputPath}" "${videoUrl}"`;
    console.log(`Executing: ${command}`);

    const { stdout, stderr } = await execAsync(command);
    console.log('STDOUT:', stdout);
    console.log('STDERR:', stderr);

    // Verify the file was created
    if (fs.existsSync(outputPath)) {
      console.log(`Successfully downloaded: ${outputPath}`);
      return outputPath;
    }
    throw new Error('Downloaded file not found');
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error(`Audio download error: ${error.message}`);
  }
};

module.exports = downloadAudio;