# Webgallery REST API Documentation

## Gallery API

### Create
* description: create a new user
* request: `POST /api/user/signup/`
    * content-type: `application/json`
    * body: object
        * username: (string) the user's desired username
        * password: (string) the user's desired password
 * response: 200
    * body: User has been created
 * response: 409
    * body: User name already exists
 * response: 500
    * body: Unable to perform this request
 ```shell
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -d '{"username":"Sakura","password":"123"} 
       -c cookie.txt 
       http://localhost:3000/api/user/signup/'
```
* description: check a new user's credentials
* request: `POST /api/user/signin/`
    * content-type: `application/json`
    * body: object
        * username: (string) the user's username
        * password: (string) the user's password
 * response: 200
    * body: User has signed in
 * response: 401
    * body: access denied
 * response: 500
    * body: Unable to perform this request
 ```shell
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -d '{"username":"Sakura","password":"123"} 
       -c cookie.txt 
       http://localhost:3000/api/user/signin/'
```
* description: create a new image
* request: `POST /api/image/`
    * content-type: `application/json`
    * body: object
        * title: (string) the title of the image
        * url: (object) the file uploaded from multer
 * response: 200
    * body: object
        * action: `header: /`
 ```shell
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -F 'url=@/path/image.png'
       -d '{"title":"Sakura"} 
       -b cookie.txt
       http://localhost:3000/api/image/'
```
* description: create a new comment
* request: `POST /api/comment/`
    * body: object
        * imageId: (string) the id of the image it belongs to
        * content: (string) the content of the comment
 * response: 200
    * content-type: `application/json`
    * body: object
        * _id: (string) the comment id
        * imageId: (string) the id of the image it belongs to
        * content: (string) the content of the comment
        * createdAt: (Date) the comment's creation date
        * updatedAt: (Date) the comment's update date
 ```shell
$ curl -X POST
    -H "Content-Type: `application/json`"
    -d "{"imageId":"f4asf7fw8s", "content":"This image doesn't exist!"}"
    -b cookie.txt
    http://localhost:3000/api/comment/
```

### Read

* description: logout of the gallery
* request: `GET /logout/`
* response: 200
    * body: object
        * action: `header: /`
* response: 404
    * body: image id does not exist
 ```shell
$ curl -b cookie.txt 
http://localhost:3000/logout/
```  
* description: get all the usernames without pagination
* request: `GET /api/user/`
* response: 200
    * body: list of objects 
        * array of all the usernames
 ```shell
$ curl -b cookie.txt 
http://localhost:3000/api/user/
```  
* description: get all the usernames with pagination
* request: `GET /api/user/gallery/`
* response: 200
    * body: list of objects 
        * array of all the usernames
 ```shell
$ curl -b cookie.txt 
http://localhost:3000/api/user/gallery/
```  
* description: get an image with an image id
* request: `GET /api/image/:id/`
* response: 200
    * content-type: `application/json`
    * body: object
        * _id: (string) the id of this image
        * title: (string) the title of this image
        * author: (string) the author of this image
        * createdAt: (Date) the date this image was uploaded
        * updatedAt: (Date) the date this image was updated
        * url: object
            * fieldname: (string) name of the input
            * originalname: (string) the original file name of the file uploaded
            * encoding: (string) the encoding of the uploaded file
            * mimetype: (string) the mimetype of the uploaded file
            * destination: (string) the relative directory of where the file is uploaded to
            * filename: (string) the new name of the uploaded file stored on disk
            * path: (string) the relative path of the file
            * size: (int) the size of the uploaded file
* response: 404
    * body: image id does not exist
 ```shell
$ curl -b cookie.txt 
http://localhost:3000/api/image/V5tXHm9pJAc7bk7j/
```
* description: get an image file with an image id
* request: `GET /api/image/:id/image/`
* response: 200
    * content-type: `image/*`
    * body: object
* response: 404
    * body: image id does not exist
 ```shell
$ curl -b cookie.txt
http://localhost:3000/api/image/V5tXHm9pJAc7bk7j/image/
```
* description: retrieve all the image id
* request: `GET /api/image/`
* response: 200
    * content-type: `application/json`
    * body: list
        * _id: (string) id of the image
 ```shell
$ curl -b cookie.txt http://localhost:3000/api/image/
```
* description: retrieve all the comments for the image id
* request: `GET /api/comment/:id/`
* response: 200
    * content-type: `application/json`
    * body: list of objects
        * _id: (string) the comment id
        * imageId: (string) the id of the image it belongs to
        * author: (string) the author of the comment
        * content: (string) the content of the comment
        * createdAt: (Date) the comment's creation date
        * updatedAt: (Date) the comment's update date
* response: 404
    * body: image id does not exist
 ```shell
$ curl -b cookie.txt 
http://localhost:3000/api/comment/V5tXHm9pJAc7bk7j/
```

### Delete
* description: delete the image id
* request: `DELETE /api/image/:id/`
* response: 200
    * content-type: `application/json`
    * body: object
        * _id: (string) the id of this image
        * title: (string) the title of this image
        * author: (string) the author of this image
        * createdAt: (Date) the date this image was uploaded
        * updatedAt: (Date) the date this image was updated
        * url: object
            * fieldname: (string) name of the input
            * originalname: (string) the original file name of the file uploaded
            * encoding: (string) the encoding of the uploaded file
            * mimetype: (string) the mimetype of the uploaded file
            * destination: (string) the relative directory of where the file is uploaded to
            * filename: (string) the new name of the uploaded file stored on disk
            * path: (string) the relative path of the file
            * size: (int) the size of the uploaded file
* response: 404
    * body: image id does not exist
 ```shell
$ curl -X DELETE 
    -b cookie.txt 
    http://localhost:3000/api/image/V5tXHm9pJAc7bk7j/
```
* description: delete the comment id
* request: `DELETE /api/comment/:id/`
* response: 200
    * content-type: `application/json`
    * body: object
        * _id: (string) the comment id
        * imageId: (string) the id of the image it belongs to
        * author: (string) the author of the comment
        * content: (string) the content of the comment
        * createdAt: (Date) the comment's creation date
        * updatedAt: (Date) the comment's update date
* response: 404
    * body: comment id does not exist
 ```shell
$ curl -X DELETE 
    -b cookie.txt 
    http://localhost:3000/api/comment/AcN9YF819Sg0WVXs/
```
* description: delete the comments from an image id
* request: `DELETE /api/comment/all/:id/`
* response: 200
    * content-type: `application/json`
    * body: list of objects
        * _id: (string) the comment id
        * imageId: (string) the id of the image it belongs to
        * author: (string) the author of the comment
        * content: (string) the content of the comment
        * createdAt: (Date) the comment's creation date
        * updatedAt: (Date) the comment's update date
* response: 404
    * body: image id does not exist
 ```shell
$ curl -X DELETE 
    -b cookie.txt 
    http://localhost:3000/api/comment/all/V5tXHm9pJAc7bk7j/
```
