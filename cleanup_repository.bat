@echo off
echo Cleaning up legacy test and temporary files...

del test-*.mjs
del test-*.js
del test.txt
del test.log
del test_*.txt
del check-*.js
del check_*.cjs
del check_*.js
del check_*.mjs
del tmp_*.png
del tmp_*.html
del tmp_*.json
del *_extracted.txt
del log_extract.txt
del output.txt
del test-results
rmdir /s /q .qoder
rmdir /s /q .vscode

echo Cleanup complete!
pause
