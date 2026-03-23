# bin/ — Bundled Binaries

This folder contains binaries required by setup.bat.
They are committed to the repo so servers can install without internet access.

## Required Files

### winsw.exe
Windows Service Wrapper — registers Node.js processes as Windows Services.

Download (pick one):
- https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe

Rename downloaded file to: winsw.exe
Place in: bin/winsw.exe

### openssl.exe (+ supporting DLLs)
Used to generate SSL certificates.

Download:
- https://slproweb.com/products/Win32OpenSSL.html
  → Win64 OpenSSL v3.x.x (full version, not Light)
  → After install, copy from: C:\Program Files\OpenSSL-Win64\bin\
    - openssl.exe
    - libssl-3-x64.dll
    - libcrypto-3-x64.dll
    - legacy.dll (if present)

Place all in: bin/

## After adding files

Commit to repo:
  git add bin/
  git commit -m "add bundled binaries"
  git push

All servers will now have these files available via git clone/pull.
No internet required during setup.

## .gitignore note

Make sure bin/ is NOT in .gitignore.
These binaries must be tracked by git.