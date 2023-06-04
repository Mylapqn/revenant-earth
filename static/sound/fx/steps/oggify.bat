for %%i in (*.wav) do (
	ffmpeg -i "%%i" -c:a libvorbis "%%~ni.ogg"
	del %%i
)