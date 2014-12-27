require([ "jquery" ], function($) {
	$("#changepassword").hide();

	$("#cplink").removeClass("hidden").click(function(){
		$("#changepassword").show();
		$("#changepassword input").val("");
		$("#password").select();
		$(this).remove();
		return false;
	});

	$("input[type='checkbox']").each(function(i, e){
		if ($(e).prop('checked') == false) {
			$("p#" + $(e).prop('id')).hide();
		}
	});
	$("input[type='checkbox']").change(function(){
		var active = $(this).prop('checked');

		if (active) {
			$("p#" + $(this).prop('id')).show();
		} else {
			$("p#" + $(this).prop('id')).hide();
		}
	});
});