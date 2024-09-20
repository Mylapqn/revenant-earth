for %%i in (*.ogg) do (
	ffmpeg -i "%%i" -c:a libmp3lame "%%~ni.mp3"
)