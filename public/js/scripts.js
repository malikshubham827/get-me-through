$(document).ready(
    function () {
        // Connect to the server using SocketIO
        var socket = io();
        // Tells whether user is currently being shown the liveUpdates or not.
        var liveUpdates = false;
        // If the camera is closed, and process has to be started again,
        // then firstTime = true. Initially process is not running.
        var firstTime = true;
        var QRClient = null;
        var entryIn = true; // true(check arriving people), false(check leaving people)

        $('input[name="group1"]').change(function() {
            var prev = 'in';
            if(!entryIn) prev = 'out';
            if(this.id !== prev) {
                prev = this.id;
                entryIn = !entryIn;
                socket.emit('mode change', entryIn);
                var $toastContent = $(`<span><i class="material-icons">done</i>Mode changed to: ${prev}</span>`);
                Materialize.toast($toastContent, 5000);
            }
        });

        /*
         * For QR Code scanning
         */
        // START
        let opts = {
            continuous: false,
            video: document.getElementById('preview'),
            mirror: true,
            captureImage: false,
            backgroundScan: false,
            refractoryPeriod: 5000,
            scanPeriod: 1
        }
        // Initialise the scanner
        let scanner = new Instascan.Scanner({ video: document.getElementById('preview') });

        // callback function after QR Code decoded
        var readQRCallback = function (content) {
            // send request for auth using qr code
            socket.emit('qr auth', {code: content,
                client: $(QRClient[0]).attr("data-person-head")
            });
            var $toastContent = $('<span><i class="material-icons">done</i>QR Code decoded!</span>');
            Materialize.toast($toastContent, 5000);
            scanner.removeListener('scan', arguments.callee);
            $('#modal1').modal('close');

        }

        // To stop the scanner in case user closes the Modal(click close or outside of Modal)
        stopQR = function () {
            scanner.removeListener('scan', readQRCallback);
            scanner.stop()
                .then(function () {
                    console.log("Camera stopped.");
                })
                .catch(function (e) {
                    console.log('problem closing camera: ' + e);
                })
        }

        // To decode the QR Code
        function readQR(element) {
            let result = null;
            scanner.addListener('scan', readQRCallback);
            Instascan.Camera.getCameras()
                .then(function (cameras) {
                    if (cameras.length > 0) {
                        // By default choosing the first(or only) camera
                        scanner.start(cameras[0]);

                    } else {
                        console.error('No Cameras found.');
                        var $toastContent = $('<span><i class="material-icons">report_problem</i>No Cameras found!</span>');
                        Materialize.toast($toastContent, 5000);
                    }
                });
        }
        /* 
        * END of QR Code scanning utility
        */

        // Initialise the modal intended for QR Code scanning
        $('#modal1').modal();

        // The previous liveUpdate for comparison
        var prevUpdate = null;

        // To get notified when a tab is opened(for dev only)
        // var option = {
        //     onShow: function (lol) {
        //         console.log('hi');
        //         console.log(lol[0]);
        //     }
        // }
        // $('ul.tabs').tabs(option);

        /*
            Helper function to justify whether it is required to change
            the list of verified persons or not.It helps in reducing the 
            unnecessary buffering of list items changing each time on receiving
            the liveUpdates.
            NOTE: If order does not matter 'sort' the list first then compare
        */
        function noChange(newUpdate) {
            if (prevUpdate === newUpdate) return true;
            if (prevUpdate == null || newUpdate == null) return false;
            if (prevUpdate.length != newUpdate.length) return false;

            for (var i = 0; i < prevUpdate.length; ++i) {
                if (prevUpdate[i] !== newUpdate[i]) return false;
            }
            return true;
        }

        // Send request to train the model
        $('#train-button').on('click', function () {
            var train_button = this;
            $('.progress').show();
            $(this).addClass('disabled');
            // $("a[href='#app-run']").addClass('disabled');
            $.ajax({
                url: 'http://localhost:3000/train'
            })
                .done(function (data) {
                    var $toastContent = $('<span><i class="material-icons">done</i>Training Successfull!</span>');
                    Materialize.toast($toastContent, 5000);
                    console.log(data);
                    $('.progress').hide();
                    $(train_button).removeClass('disabled');
                    $('.cross').hide();
                    $('a[href="#app-train"]').removeClass('active');
                    $('a[href="#app-run"]').trigger('click');
                    $('.tick').show();
                })
                .fail(function (data) {
                    var $toastContent = $('<span><i class="material-icons">report_problem</i>Some error occured.Try again!</span>');
                    Materialize.toast($toastContent, 5000);
                    console.log(data);
                    $(train_button).removeClass('disabled');
                })
        });

        $('#clear-button').on('click', function() {
            $(this).addClass('disabled');
            $.ajax({
                url:'http://localhost:3000/train/clear'
            })
            .done(function(data) {
                var $toastContent = $('<span><i class="material-icons">done</i>Data cleared successfully!</span>');
                Materialize.toast($toastContent, 5000);
                $('#clear-button').removeClass('disabled');
                // console.log(data);
            })
            .fail(function(data) {
                // console.log(data);
                var $toastContent = $('<span><i class="material-icons">report_problem</i>'+data.responseText+'</span>');
                Materialize.toast($toastContent, 5000);
                $('#clear-button').removeClass('disabled');
            });
        });

        // Send request to run the face-recognition program
        $('#run-button').on('click', function () {
            liveUpdates = true;
            $('#run-button').addClass('disabled');
            $('#stop-button').removeClass('disabled');

            if (firstTime) {
                socket.emit('receive liveUpdates');
                $('#halt-resume').removeClass('disabled');
                firstTime = false;
            } else {
                socket.emit('resume liveUpdates');
            }
        });

        // Send request to stop the python process of face recognition
        $('#stop-button').on('click', function () {
            firstTime = true;
            $(this).addClass('disabled');
            $('#halt-resume').html('Halt<i class="material-icons right">thumbs_up_down</i>');
            $('#halt-resume').addClass('disabled');
            socket.emit('stop liveUpdates');
            $('.collapsible').empty();
            $('.collapsible').hide();
        });

        // Halt/Resume the liveUpdates feature
        $('#halt-resume').on('click', function () {
            if (liveUpdates) {
                // liveUpdates ON so turn it OFF
                liveUpdates = false;
                socket.emit('halt liveUpdates');
                // change text
                $(this).html('<i class="material-icons right">thumbs_up_down</i>Resume');
                var $toastContent = $('<span><i class="material-icons">report_problem</i>Live Updates, halted!</span>');
                Materialize.toast($toastContent, 5000);
            } else {
                liveUpdates = true;
                socket.emit('resume liveUpdates');
                $(this).html('Halt<i class="material-icons right">thumbs_up_down</i>');
                var $toastContent = $('<span><i class="material-icons">done</i>Live Updates, resumed!</span>');
                Materialize.toast($toastContent, 5000);
            }
        });

        // Open Modal for QR Code scanning
        $(document).on('click', function (e) {
            // console.log(e);
            if ($(e.target).hasClass('fa-qrcode')) {
                $('#modal1').modal('open');
                QRClient = $(e.target).parent().parent();
                readQR();  
            }
        });

        /*
            This button is triggered when the modal closes,
            currently Modal's complete/ready callback are
            not working so materalize.js is changed to
            trigger this event via this hidden button on line 890.
        */
        $('#hidden-btn').on('click', stopQR);

        // New update received from server
        socket.on('new liveUpdates', function (update) {
            msg = JSON.parse(update);
            // console.log(msg);
            if (!noChange(msg)) {
                prevUpdate = msg;
                $('.collapsible').empty();
                // Show the new updated list.
                msg.forEach(function (name) {
                    let icon_name = "verified_user";
                    let person_name_formatted = name.split(' ').join('-');
                    if (name.includes("Unknown")) {
                        icon_name = "info_outline";
                    }
                    var template = $('#person-template').html();
                    var html = Mustache.render(template, {
                        // verify_status,
                        person_name_formatted,
                        icon_name,
                        person_name: name
                    })
                    $('.collapsible').append(html);
                });
                // 1.) Show it
                $('.collapsible').show();
                // 2.) Initialise the new list
                $('.collapsible').collapsible();
            }

        });

        /* 
            If there is an error in starting the face recognition 
            program(Python child process) or OpenCV(webcam feed)
        */
        socket.on('start error', function () {

            var $toastContent = $('<span><i class="material-icons">report_problem</i>Start error.Try again!</span>');
            Materialize.toast($toastContent, 5000);
            console.log('start error.Try again.');
            $('#run-button').removeClass('disabled');
            $('#stop-button').addClass('disabled');
        });

        /*
            If there is an error in stopping the camera
            or face recognition program(Python child process)
        */
        socket.on('stop error', function (msg) {
            var $toastContent = $('<span><i class="material-icons">report_problem</i>Stop error.Try again!</span>');
            Materialize.toast($toastContent, 5000);
            console.log(msg);
            $('#run-button').removeClass('disabled');
        });

        /*
            If the stopping operation is carried out successfully
        */
        socket.on('stop success', function () {
            var $toastContent = $('<span><i class="material-icons">done</i>Stopped successfully!</span>');
            Materialize.toast($toastContent, 5000);
            console.log('stop success.');
            $('#run-button').removeClass('disabled');
        });

        /*
            If the FACE authentication process completed successfully
        */
        socket.on('auth success', function(obj) {
            var template = $('#person-details-template').html();
            var departureTime = 'Nil';
            if (obj.details.status === 'out') {
                departureTime = obj.details.timeOut;
            }
            var html = Mustache.render(template, {
                msg: obj.msg,
                name: obj.details.name,
                email: obj.details.email,
                status: obj.details.status,
                timeIn: obj.details.timeIn,
                timeOut: departureTime,
                allow: obj.details.allow
            });
            var alias = obj.name.split(' ').join('-');
            var str = `[data-person=${alias}]`
            $(str).empty();
            $(str).append(html);
            // Change the color
            $(`[data-person-head=${alias}]`).css("color", 'green');
        });

        /*
            If the FACE authentication process has an error/unknown visitor
        */
        socket.on('auth error', function(obj) {
            var template = $('#person-msg-template').html();
            var html = Mustache.render(template,{msg: obj.msg});
            var alias = obj.name.split(' ').join('-');
            var str = `[data-person=${alias}]`
            $(str).empty();
            $(str).append(html);
            // color
            $(`[data-person-head=${alias}]`).css("color", 'red');
        });

        /*
            If the QR Code authentication process completed successfully
        */
        socket.on('qr auth success', function(obj) {
            console.log(' qr suc');
            var template = $('#person-details-template').html();
            var departureTime = 'Nil';
            if (obj.details.status === 'out') {
                departureTime = obj.details.timeOut;
            }
            var html = Mustache.render(template, {
                msg: obj.msg,
                name: obj.details.name,
                email: obj.details.email,
                status: obj.details.status,
                timeIn: obj.details.timeIn,
                timeOut: departureTime,
                allow: obj.details.allow
            });
            $(`[data-person="${obj.client}"]`).empty();
            $(`[data-person="${obj.client}"]`).append(html);
            // color
            $(`[data-person-head="${obj.client}"]`).css("color", 'green');
        });

        /*
            If the QR Code authentication process has an error/unknown visitor
        */
        socket.on('qr auth error', function(obj) {
            console.log('qr fail');
            var template = $('#person-msg-template').html();
            var html = Mustache.render(template,{msg: obj.msg});
            $(`[data-person="${obj.client}"]`).empty();
            $(`[data-person="${obj.client}"]`).next().append(html);
            // color
            $(`[data-person-head="${obj.client}"]`).css("color", 'red');
        });
    }
)

/*
    THE END:
    your code here:
    :)
*/