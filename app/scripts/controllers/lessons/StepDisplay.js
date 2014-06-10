'use strict';

angular.module('lergoApp').controller('LessonsStepDisplayCtrl', function($scope, $rootScope, $log, $routeParams, $sce, LergoClient) {
	$log.info('showing step');

	if (!!$routeParams.data) {
		$scope.step = JSON.parse($routeParams.data);
		$log.info($scope.step);
	}

	$scope.currentIndex = 0;
	$scope.answers = {};
	function reload() {
		if (!$scope.step) {
			return;
		}

		$scope.currentIndex = 0;
		$scope.answers = {};

		// guy - do not use 'hasOwnProperty' as scope might not have the
		// property, but there is such a value.
		if (!!$scope.step && !!$scope.step.quizItems && !$scope.questions) {

			LergoClient.questions.findQuestionsById($scope.step.quizItems).then(function(result) {
				var questions = {};
				for ( var i in result.data) {
					questions[result.data[i]._id] = result.data[i];
				}
				$scope.questions = questions;
			});

		}
	}

	$scope.$watch('step', reload);

	$scope.getQuizItemTemplate = function(id) {
		if (!!$scope.questions) {
			$scope.quizItem = $scope.questions[id];
			return !!$scope.quizItem && LergoClient.questions.getTypeById($scope.quizItem.type).viewTemplate || "";
		}
		return '';
	};

	$scope.checkAnswer = function() {
		var quizItem = $scope.quizItem;
		LergoClient.questions.checkAnswer(quizItem).then(function(result) {
			$scope.answers[quizItem._id] = result.data;
			$rootScope.$broadcast('questionAnswered', {
				'userAnswer' : quizItem.userAnswer,
				'checkAnswer' : result.data,
				'quizItemId' : quizItem._id

			});
		}, function() {
			$log.error('there was an error checking answer');
		});
	};

	$scope.updateAnswer = function(event, answer, quizItem) {
		// This method will call only in the scenario of multiple choice
		// question and where we can have more then one correct answer.
		$log.info('updating answer', arguments);
		if (quizItem.userAnswer === undefined) {
			quizItem.userAnswer = [];
		}
		var checkbox = event.target;
		if (checkbox.checked) {
			quizItem.userAnswer.push(answer);
		} else {
			quizItem.userAnswer.splice(quizItem.userAnswer.indexOf(answer), 1);
		}
	};

	$scope.getQuizItem = function() {

		if (!!$scope.step && $scope.step.quizItems.length > $scope.currentIndex) {
			return $scope.step.quizItems[$scope.currentIndex];
		}
		return null;
	};

	$scope.getAnswer = function() {
		var quizItem = $scope.quizItem;

		return !!quizItem && $scope.answers.hasOwnProperty(quizItem._id) ? $scope.answers[quizItem._id] : null;
	};

	$scope.nextQuizItem = function() {
		$log.info('next');
		var quizItem = $scope.quizItem;
		if ($scope.answers.hasOwnProperty(quizItem._id)) {
			$scope.currentIndex++;
		}
	};

	$scope.hasNextQuizItem = function() {
		return !!$scope.step && $scope.currentIndex < $scope.step.quizItems.length - 1;
	};

	$scope.getStepViewByType = function(step) {
		var type = 'none';
		if (!!step && !!step.type) {
			type = step.type;
		}
		return 'views/lesson/steps/view/_' + type + '.html';
	};

	$scope.getYoutubeEmbedSource = function(step) {
		var src = '//www.youtube.com/embed/' + $scope.getVideoId(step) + '?autoplay=1&rel=0&iv_load_policy=3';
		return $sce.trustAsResourceUrl(src);
	};

	$scope.getVideoId = function(step) {
		var value = null;
		if (!!step && !!step.videoUrl) {
			if (step.videoUrl.toLocaleLowerCase().indexOf('youtu.be') > 0) {
				value = step.videoUrl.substring(step.videoUrl.lastIndexOf('/') + 1);
			} else {
				value = step.videoUrl.split('?')[1].split('v=')[1];
			}
		}

		return value;
	};

	$scope.getCorrectAnswers = function(quizItem) {
		var answers = [];
		if (!quizItem|| !quizItem.type || !LergoClient.questions.getTypeById(quizItem.type).answers(quizItem)) {
			return answers;
		}
		return LergoClient.questions.getTypeById(quizItem.type).answers(quizItem);
	};
});
