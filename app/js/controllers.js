var medlrApp = angular.module('medlrApp', []);

medlrApp.controller('SegmentListCtrl', function ($scope, $http) {

	// Load some json data!
	$http.get('resources/songs.json')
		.then(function(res){
		  $scope.songs = res.data; 
		  window.ss = $scope.songs               
		});
	$http.get('resources/segments.json')
		.then(function(res){
		  $scope.segments = res.data;                
		});

	window.s = $scope.segments;

	// Establish the ui sortable lists
    var sortableEle;
    $scope.sortableArray = [
        'One', 'Two', 'Three'
    ];
    $scope.add = function() {
        $scope.sortableArray.push('Item: '+$scope.sortableArray.length);
        sortableEle.refresh();
    }
    $scope.dragStart = function(e, ui) {
        ui.item.data('start', ui.item.index());
    }
    $scope.dragEnd = function(e, ui) {
        var start = ui.item.data('start'),
            end = ui.item.index();
        $scope.sortableArray.splice(end, 0, 
            $scope.sortableArray.splice(start, 1)[0]);
        $scope.$apply();
    }
    sortableEle = $('#medlr-timeline, #medlr-segment-list').sortable({
        connectWith: ['.medlr-segments'],
        start: $scope.dragStart,
        update: $scope.dragEnd
    });

    // Vars to store segment/video data
    $scope.video;
    $scope.currentSegment;
    $scope.orderedSegments = [];
    var timerVideoPositionCheck;

    // Function to convert the segments into a singable song
    $scope.singNowClicked = function(){
		console.log('Sing now');
		// build list of segment ids
		
		$('#medlr-timeline li').each(function(i, item){
			id = $(item).attr('data-segment-id')
			console.log('push id '+id)
			console.log('seg is:')
			console.log($scope.getSegmentObjectFromId(id))
			$scope.orderedSegments.push($scope.getSegmentObjectFromId(id)) 
		});
		console.log('segmentIds:')
		console.log($scope.orderedSegments)
		console.log('$scope.orderedSegments.length'+$scope.orderedSegments.length)
		// Start playing 'em! 
		$scope.currentSegment = 0;
		// Start the first one, then the player ticker will decide when to swap videos out based on thier length
		$scope.playVideo()
	}

	// Pause the song, stop intevals and video playback
	$scope.pauseButtonText = "Pause"
    $scope.pauseClicked = function(){
		console.log('Pause');
		if($scope.pauseButtonText == "Pause"){
			$scope.pauseButtonText = "Play";
			$scope.playVideo();
		}else{
			$scope.pauseButtonText = "Pause"
			$scope.video.pause();
			window.clearInterval(timerVideoPositionCheck);	
		}
	}

	// the PLAYER function, which pretty much swaps videos in and out to simulate medley splicing
	$scope.playVideo = function(){

		if($scope.currentSegment >= $scope.orderedSegments.length){
			return false;
		}
		// Update current segment
		segment = $scope.orderedSegments[$scope.currentSegment]
		// Set the video 
		videoFile = segment.video;
		//console.log('play video fileName:'+videoFile+', start:'+segment.start_time+', duration:'+(segment.end_time-segment.start_time));
		// There may be more than one video object due to crossfade, so grab the last one!
		video = $('#player #video-container video').last();
		video.attr('src', videoFile+'#t='+segment.start_time);		
		// Set the video element for use in other functions
		$scope.video = video.get(0)
		// and play it!
		$scope.video.play();	
		// Listen for the end of this video/segment as marked by the segment.end_time, and move on to next video when it's reached
		timerVideoPositionCheck = window.setInterval($scope.checkVideoTime, 250);
		// Update the medlr timeline ui
		$('#medlr-timeline li.active').removeClass('active').addClass('sang')
		$('#medlr-timeline li[data-segment-id="'+segment.id+'"]').addClass('active')
	}

	// to play the next video/segment. Handles the fadeout/fade in of video A (current) and B (next)
    $scope.playNext = function(){
    	// increment segment position
    	$scope.currentSegment++;
    	if($scope.currentSegment >= $scope.orderedSegments.length){
    		window.clearInterval(timerVideoPositionCheck);
    		//alert('Finished!');
    	}else{

    		// The CROSSFADE! 

    		// Clone the video object so we can create the fade in    		
    		fadeSpeed = 3000
    		startVolume = 0.35
    		videoContainer = $('#player #video-container')
    		videoContainer.append($('video', videoContainer).clone())
    		// Fade inthe video, and its sound level too
    		$('video', videoContainer).last().hide().fadeIn(fadeSpeed)
    		$('video', videoContainer).last().get(0).volume = startVolume
    		$('video', videoContainer).last().animate({volume: 1}, fadeSpeed);
    		// Fade out the current video, and its sound level too, then remove it
    		oldVideo = $('video', videoContainer).first()
    		oldVideo.animate({volume: 0}, fadeSpeed);
    		oldVideo.fadeOut(fadeSpeed, function(){
    			oldVideo.remove()
    		})
    		$scope.playVideo();
    	}
	}

	// Check the current posiiton of the playing video in order to see if it's time for the next segment!
	$scope.checkVideoTime = function(){
		segment = $scope.orderedSegments[$scope.currentSegment]
		//console.log('check video time. Current:'+$scope.video.currentTime+', seg end:'+segment.end_time)
		if($scope.video.currentTime >= segment.end_time){
			console.log('NEEEEXTT')
			$scope.playNext();
		}
	};

	// Grab a song object form song json using a given ID
	$scope.getSongObjectFromId = function(id){
		for (var i=0; i<$scope.songs.length; i++){
			if($scope.songs[i]['id'] == id){
				return $scope.songs[i]
			}
		}
		// none found
		return false
	};

	// Grab a segment object form song json using a given ID
	$scope.getSegmentObjectFromId = function(id){
		for (var i=0; i<$scope.segments.length; i++){
			if($scope.segments[i]['id'] == id){
				return $scope.segments[i]
			}
		}
		return false
	};

	// Interface stuff
	$scope.toggleAvailableSegments = function(){
		return
		$('#available-segments-container ul').toggle()
		$('body').toggleClass('available-segments-open')
	};


}); // end controller stuff

