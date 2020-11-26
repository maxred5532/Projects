(function(){
    "use strict";

    var imagesDatabase = [];
    var currentGallery = null;
    var currentIndex;
    var currentOffsetComment = 0;
    var currentOffsetGallery = 0;
    var currentUser;
    var entryPerPage = 10;      // Need to change in app.js as well

    // Pad 0 in front of number to format them
    function pad(number) {
        return number < 10 ? "0" + number : number;
    }

    // Format the date to look better
    function formatDate(stringDate) {
        var givenDate = new Date(stringDate);

        var curYear = givenDate.getFullYear();
        var curMonth = givenDate.getMonth() + 1;
        var curDate = givenDate.getDate();
        var curHour = givenDate.getHours();
        var curMinute = givenDate.getMinutes();
        var curSecond = givenDate.getSeconds();

        var fullDate = curYear + "-" + pad(curMonth) + "-" + pad(curDate) + " ";
        fullDate += pad(curHour) + ":" + pad(curMinute) + ":" + pad(curSecond);

        return fullDate;
    }

    // Get all the imageIds from the API and store it into imagesDatabase
    function refreshImageIds(showOption) {
        showOption = (showOption === null || showOption === undefined) ? 0 : showOption;
        imagesDatabase = [];
        api.getAllImageIds(currentGallery, function(err, imageIds) {
            imagesDatabase = imageIds;
            load(showOption);
        });
    }

    // Determine which image to show
    //   - 0: load first image or display no image notice
    //   - 1: load previous image
    //   - 2: load next image
    function load(showOption) {
        // Comment always offsets to 0 no matter what
        currentOffsetComment = 0;

        if (imagesDatabase.length < 1) {
            showOption = 0;
        }

        switch (showOption) {
            case 0:
                // First load, try to get the first image
                if (imagesDatabase.length < 1) {
                    // Show message that there are no images in the gallery
                    var imageContainer = document.getElementById("image-container");
                    var messageContainer = document.getElementById("message-container");
                    var messageCommentPager = document.getElementById("comment-pager");
                    var messagePostContainer = document.getElementById("message-form");
                    var htmlNotice = document.createElement("div");
                    // Reset the containers
                    imageContainer.innerHTML = "";
                    messageContainer.innerHTML = "";
                    messagePostContainer.style.display = "none";
                    messageCommentPager.style.display = "none";
                    // Add notice and append everything into the containers
                    htmlNotice.className = "notice";
                    htmlNotice.innerHTML = "Currently no image in " + currentGallery + "'s gallery.";
                    imageContainer.append(htmlNotice);

                    // Non-existent image indicator
                    currentIndex = -1;
                } else {
                    // Show the first image since there is at least 1 image in the list
                    loadImage(imagesDatabase[0]);
                    loadComments(imagesDatabase[0], currentOffsetComment, true);
                    currentIndex = 0;
                }
                break;
            case 1:
                // Load the previous image
                // Only load when there are more images before this image in the array
                if (currentIndex > 0) {
                    currentIndex--;
                    loadImage(imagesDatabase[currentIndex]);
                    loadComments(imagesDatabase[currentIndex], currentOffsetComment, true);
                }
                break;
            case 2:
                // Load the next image
                // Only load when there are more images after this image in the array
                if (currentIndex < imagesDatabase.length - 1) {
                    currentIndex++;
                    loadImage(imagesDatabase[currentIndex]);
                    loadComments(imagesDatabase[currentIndex], currentOffsetComment, true);
                }
                break;
            case 3:
                // After deleting an image
                // Update all images
                if (imagesDatabase.length <= 2) {
                    // Empty or only has 1 thing
                    load(0);
                } else if (currentIndex < imagesDatabase.length - 1) {
                    // Still images after this image, load the next one
                    // adjustment for offset
                    currentIndex--;
                    load(2);
                } else {
                    // Load previous image
                    load(1);
                }
                break;
            default:
                // Shouldn't be here
                break;
        }
    }

    function loadImage(imageId) {

        api.getImage(imageId, function(err, image) {
            var elmt = document.createElement("div");
            elmt.innerHTML = "<h1>" + image.title + "</h1>" +
                "<div class='gallery'>" +
                "<div class='prev icon'></div>" +
                "<img class='image' src='/api/image/" + imageId + "/image/'/>" +
                "<div class='next icon'></div>" +
                "</div>" +
                "<div class='gallery-info'>" +
                "<div class='image-author'>" + image.author + " @ " + formatDate(image.createdAt) + "</div>" +
                "</div>";

            // Only the image owner can delete their own image
            if (api.getCurrentUser() === image.author) {
                elmt.querySelector(".gallery-info").innerHTML += "<div class='image-delete'>" +
                    "<div class='image-delete icon'></div>Delete Image</div>";

                /* ***** Delete Image ***** */
                elmt.querySelector(".image-delete").addEventListener('click', function() {
                    api.deleteComments(imageId, function(er) {
                        api.deleteImage(imageId, function(err) {
                            if (!err) {
                                refreshImageIds(3);
                            }
                        });
                    });
                }, false);
            }


            /* ***** Image navigation ***** */
            elmt.querySelector(".prev").addEventListener('click', function() {
                load(1);     // 1: load previous image
            }, false);

            elmt.querySelector(".next").addEventListener('click', function() {
                load(2);     // 2: load next image
            }, false);


            document.querySelector("#image-container").innerHTML = "";
            document.querySelector("#image-container").prepend(elmt);
            // console.log(image);
        });
    }


    function loadComments(imageId, offset, forceClear) {
        offset = (offset === null || offset === undefined) ? 0 : offset;
        // Set forceClear to true when the comment box should be emptied
        // so emptying comment check will be ignored
        forceClear = (forceClear === null || forceClear === undefined) ? false : forceClear;

        var messageContainer = document.getElementById("message-container");
        var messagePostContainer = document.getElementById("message-form");
        var messageCommentPager = document.getElementById("comment-pager");

        if (forceClear) {
            messageContainer.innerHTML = "";
        }

        api.getComments(imageId, offset, function(err, data) {
            // hide the container to post comments if there are no image
            // currently being displayed
            if (data === null) {
                messagePostContainer.style.display = "none";
                messageCommentPager.style.display = "none";
            } else {
                messagePostContainer.style.display = "flex";
                messageCommentPager.style.display = "flex";
                console.log(data);
                if (data.length !== 0) {
                    // Clear old messages
                    messageContainer.innerHTML = "";
                    api.getImage(imageId, function(e, image) {
                        for (var i = 0; i < data.length; i++) {
                            messageContainer.append(makeHTMLComment(data[i], image.author));
                        }
                        currentOffsetComment = offset;
                    });
                }
            }
        });
    }

    // Given the comment, return the container for the comment
    function makeHTMLComment(comment, imageAuthor) {

        var elmt = document.createElement("div");
        elmt.innerHTML = "<div id='message-container'>" +
            "<div class='msg'>" +
                "<div class='author-details'>" +
                    "<img class='author-image' src='./media/user.svg'/>" +
                    "<div class='author-name'>" + comment.author + "</div>" +
                "</div>" +
                "<div class='message-content'>" +
                    "<p>" + comment.content + "</p>" +
                    "<div class='message-date'>" + formatDate(comment.createdAt) + "</div>" +
                "</div>" +
            "</div>" +
        "</div>";

        if (api.getCurrentUser() === comment.author || api.getCurrentUser() === imageAuthor) {
            elmt.querySelector(".msg").innerHTML += "<div class='delete-icon icon'></div>";

            // Activate the delete button
            elmt.querySelector(".delete-icon").addEventListener('click', function() {
                api.deleteComment(comment._id, function(err) {
                    if (!err) {
                        currentOffsetComment = 0;
                        loadComments(comment.imageId, 0, true);
                    } else {
                        document.querySelector('.user-alert-message').innerHTML = err;
                        document.querySelector('.user-alert-message').style.visibility = "visible";
                    }
                });
            }, false);
        }
        return elmt;
    }

    function commentPager(imageId, offset) {
        var newOffset = currentOffsetComment + offset;
        loadComments(imagesDatabase[currentIndex], newOffset);
    }

    // User login or register
    function userSubmit() {
        console.log(document.querySelector("#login-form").checkValidity());
        if (document.querySelector("#login-form").checkValidity()) {
            var username = document.querySelector("#login-form [name=username]").value;
            var password = document.querySelector("#login-form [name=password]").value;
            var action = document.querySelector("#login-form [name=action]").value;
            api[action](username, password, function(err, res) {
                if (err) {
                    document.querySelector('.user-alert-message').innerHTML = err;
                    document.querySelector('.user-alert-message').style.visibility = "visible";
                } else window.location = '/';
            });
        }
    }

    // Either return signup or login container
    function loginAndRegisterContainer() {
        var elmt = document.createElement("div");
        elmt.innerHTML = "<div class='notice'>Please login or register to view galleries</div>" +
            "<form id='login-form' autocomplete='off'>" +
                "<input type='text' name='username' class='post-author' placeholder='Enter a username' required/>" +
                "<input type='password' name='password' class='post-author' placeholder='Enter a password' autocomplete='off' required/>" +
                "<div>" +
                    "<button class='post-submit' id='signin' name='action'>Sign in</button>" +
                    "<button class='post-submit' id='signup' name='action'>Sign up</button>" +
                "</div>" +
            "</form>";

        elmt.querySelector('#signin').addEventListener("click", function() {
            elmt.querySelector("form [name=action]").value = "signin";
            userSubmit();
        });

        elmt.querySelector('#signup').addEventListener("click", function() {
            elmt.querySelector("form [name=action]").value = "signup";
            userSubmit();
        });

        elmt.querySelector('#login-form').addEventListener("submit", function(e) {
            e.preventDefault();
        });

        return elmt;
    }

    // return a logout container
    function logoutContainer() {
        var elmt = document.createElement("div");
        elmt.innerHTML = "<div class='logout-button'>Logout</div>";

        elmt.querySelector('.logout-button').addEventListener("click", function(e) {
            window.location = '/logout/';
        });
        return elmt;
    }

    // return a container to go to the user's own gallery
    function myGalleryContainer() {
        var elmt = document.createElement("div");
        elmt.innerHTML = "<div class='view-my-gallery'>View My Gallery</div>";

        elmt.querySelector('.view-my-gallery').addEventListener("click", function(e) {
            galleryLoad(api.getCurrentUser());
        });
        return elmt;
    }

    function loadGallery(offset) {
        offset = (offset === null || offset === undefined) ? 0 : offset;

        // Make sure the paging is within bounds
        api.getPagedUsernames(offset, function(err, data) {
            var container = document.querySelector("#image-container");
            var userGalleryContainer = document.createElement("div");

            if (!err) {
                if (data.length !== 0) {
                    container.innerHTML = "<h1>Galleries</h1>";
                    // Display user gallery
                    for (var i = 0; i < data.length; i++) {
                        var userGalleryLink = document.createElement("div");
                        var current = data[i];
                        userGalleryLink.innerHTML = "<div class='gallery-list'>" + current + "'s Gallery</div>";
                        userGalleryLink.querySelector(".gallery-list").addEventListener('click', galleryLoad.bind(this, current), false);
                        container.append(userGalleryLink);
                    }

                    var navigation = document.createElement("div");

                    // Pager
                    navigation.innerHTML = "<div class='gallery-list-pager'>" +
                            "<div class='pager-prev icon'></div>" +
                            "<div class='pager-next icon'></div>" +
                        "</div>";
                    /* ***** Gallery navigation ***** */
                    navigation.querySelector(".pager-prev").addEventListener('click', function() {
                        galleryPager(-entryPerPage);
                    }, false);

                    navigation.querySelector(".pager-next").addEventListener('click', function() {
                        galleryPager(entryPerPage);
                    }, false);

                    container.append(userGalleryContainer);
                    container.append(navigation);

                    currentOffsetGallery = offset;
                }
            } else {
                container.innerHTML = "<div class='notice'>Unable to display any gallery :(</div>";
                container.innerHTML += "<br>" + err;
            }
        });
    }

    function galleryPager(offset) {
        var newOffset = currentOffsetGallery + offset;
        loadGallery(newOffset);
    }

    // Load the gallery when there's a user selected
    function galleryLoad(thisUser) {

        currentGallery = thisUser;

        // Initialize all the variables
        // Wanted to use const but JSHint says no
        imagesDatabase = [];

        // Get all image ids
        refreshImageIds();

        document.querySelector("#message-form").addEventListener("submit", function (e) {
            e.preventDefault();
            var commentContent = document.getElementById("comment-content").value;

            // api.addComment(imagesDatabase[currentIndex], commentAuthor, commentContent);
            api.addComment(imagesDatabase[currentIndex], commentContent, function (err) {
                if (!err) {
                    // clean form
                    document.getElementById("message-form").reset();
                    // Refresh all the comments (This will ensure there are only 10 comments always)
                    loadComments(imagesDatabase[currentIndex]);
                } else {
                    document.querySelector('.user-alert-message').innerHTML = err;
                    document.querySelector('.user-alert-message').style.visibility = "visible";
                }
            });
        });

        var commentPagerHub = document.getElementById("comment-pager");

        // User offsets comments by -10 (previous page)
        commentPagerHub.getElementsByClassName("pager-prev")[0].addEventListener("click", function () {
            commentPager(imagesDatabase[currentIndex], -entryPerPage);
        });

        // User offsets comments by +10 (next page)
        commentPagerHub.getElementsByClassName("pager-next")[0].addEventListener("click", function () {
            commentPager(imagesDatabase[currentIndex], entryPerPage);
        });
    }

    window.addEventListener('load', function() {

        // User is not logged in
        currentUser = api.getCurrentUser();
        if (!currentUser) {

            // Hide upload image
            document.querySelector(".add-image-form-container").style.visibility = "hidden";
            document.querySelector(".mini-event-container").innerHTML = "";

            var messageContainer = document.getElementById("image-container");
            messageContainer.innerHTML = "";

            messageContainer.append(loginAndRegisterContainer());

        } else {

            // Add image form
            var toggleStatus = false;

            // toggle image uploading form
            document.querySelector("#upload-toggle").addEventListener("click", function(e) {
                e.preventDefault();
                // Gives it a fade and slide effect I guess
                document.querySelector("#image-form").style.visibility  = toggleStatus ? "hidden" : "visible";
                document.querySelector("#image-form").style.opacity     = toggleStatus ? "0" : "1";
                document.querySelector("#image-form").style.height      = toggleStatus ? "0px" : "180px";
                document.querySelector("#image-form").style.margin      = toggleStatus ? "0px 15px 0px 15px" : "30px 15px 30px 15px";
                toggleStatus = !toggleStatus;
            });


            // Display upload
            document.querySelector(".add-image-form-container").style.visibility = "visible";

            var signoutButton = document.querySelector(".mini-event-container");
            signoutButton.innerHTML = "";
            signoutButton.append(logoutContainer());
            signoutButton.append(myGalleryContainer());
            galleryPager(0);

        }
    });
}());
