#\!/bin/bash
# Update Go dependencies to latest versions
go get -u github.com/labstack/echo/v4@latest
go get -u github.com/sirupsen/logrus@latest
go get -u golang.org/x/sys@latest
go get -u golang.org/x/crypto@latest
go get -u golang.org/x/net@latest
go get -u golang.org/x/text@latest
go mod tidy
