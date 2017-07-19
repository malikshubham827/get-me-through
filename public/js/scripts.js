$(document).ready(
    function () {
        // Connect to the server using SocketIO
        var socket = io();
        // Tells wheather user is currently being shown the liveUpdates or not.
        var liveUpdates = false;
        // If the camera is closed, and process has to be started again,
        // then firstTime = true. Initially process is not running.
        var firstTime = true;

        // For QR Code scanning
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
        let scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
        var readQRCallback = function (content) {
            console.log(content);
            var $toastContent = $('<span><i class="material-icons">done</i>QR Code decoded!</span>');
            Materialize.toast($toastContent, 5000);
            scanner.removeListener('scan', arguments.callee);
            $('#modal1').modal('close');

        }

        stopQR = function () {
            console.log('in stop');
            scanner.removeListener('scan', readQRCallback);
            scanner.stop()
                .then(function () {
                    console.log("Camera stopped.");
                })
                .catch(function (e) {
                    console.log('problem closing camera: ' + e);
                })
        }

        function readQR() {
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
        // END of QR Code scanning utility

        // Initialise the modal intended for QR Code scanning
        $('#modal1').modal();

        // The previous liveUpdate for comparison
        var prevUpdate = null;

        var option = {
            onShow: function (lol) {
                console.log('hi');
                console.log(lol[0]);
            }
        }
        $('ul.tabs').tabs(option);
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
                    var $toastContent = $('<span><i class="material-icons">done</i>Training Successfull.!</span>');
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
                    let verify_status = "verify_true";
                    // TODO: Add details
                    let details = "Lorem ipsum."
                    if (name.includes("Unknown")) {
                        icon_name = "info_outline";
                        verify_status = "verify_false";
                    }
                    var template = $('#person-template').html();
                    var html = Mustache.render(template, {
                        verify_status,
                        icon_name,
                        person_name: name,
                        person_details: details
                    })
                    $('.collapsible').append(html);
                });
                // 1.) Show it
                $('.collapsible').show();
                // 2.) Initialise the new list
                $('.collapsible').collapsible();
            }

        });



        // Open Modal for QR Code scanning
        $(document).on('click', function (e) {
            if ($(e.target).hasClass('fa-qrcode')) {
                $('#modal1').modal('open');
                readQR();
            }
        });

        $('#hidden-btn').on('click', stopQR);

        socket.on('start error', function () {

            var $toastContent = $('<span><i class="material-icons">report_problem</i>Start error.Try again!</span>');
            Materialize.toast($toastContent, 5000);
            console.log('start error.Try again.');
            $('#run-button').removeClass('disabled');
            $('#stop-button').addClass('disabled');
        });

        socket.on('stop error', function (msg) {
            var $toastContent = $('<span><i class="material-icons">report_problem</i>Stop error.Try again!</span>');
            Materialize.toast($toastContent, 5000);
            console.log(msg);
            $('#run-button').removeClass('disabled');
        });

        socket.on('stop success', function () {
            var $toastContent = $('<span><i class="material-icons">done</i>Stopped successfully!</span>');
            Materialize.toast($toastContent, 5000);
            console.log('stop success.');
            $('#run-button').removeClass('disabled');
        });
    }
)