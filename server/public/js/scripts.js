$(document).ready(
    function() {
        var option = {
            onShow: function(lol) {
            console.log('hi');
            console.log(lol[0]);
            }
        }
        $('ul.tabs').tabs(option);

        // Send request to train the model
        $('#train-button').on('click', function() {
            var train_button = this;
            $('.progress').show();
            $(this).addClass('disabled');
            // $("a[href='#app-run']").addClass('disabled');
            $.ajax({
                url:'http://localhost:3000/train'
            })
            .done(function(data) {
                console.log(data);
                $('.progress').hide();
                $(train_button).removeClass('disabled');
                $('.cross').hide();
                $('a[href="#app-train"]').removeClass('active');
                $('a[href="#app-run"]').trigger('click');
                $('.tick').show();
            })
            .fail(function(data) {
                console.log(data);
                $(train_button).removeClass('disabled');
            })
        });

        // Send request to run the face-recognition program
        $('#run-button').on('click',function() {
            var run_button = this;
            $(run_button).addClass('disabled');
            $('#stop-button').removeClass('disabled');
            
            $.ajax({
                url:'http://localhost:3000/run'
            })
            .done(function(data) {
                console.log(data);
                $(run_button).removeClass('disabled');
            })
            .fail(function(data) {
                console.log(data);
                $(run_button).removeClass('disabled');
            })
        });

        $('#stop-button').on('click', function() {
            $(this).addClass('disabled');
            $.ajax({
                url: 'http://localhost:3000/run/stop'
            })
            .done(function(data) {
                console.log(data);
            })
            .fail(function(data) {
                console.log(data);
            })
        });
    }
)