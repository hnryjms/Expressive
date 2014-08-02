require([ "jquery" ], function($) {
	$("#changepassword").hide();

	$("#cplink").removeClass("hidden").click(function(){
		$("#changepassword").show();
		$("#changepassword input").val("");
		$("#password").select();
		$(this).remove();
		return false;
	});
	if ($("input#active").prop('checked') == false) {
		$("#mailpassword").hide();
	}
	$("input#active").change(function(){
		var active = $(this).prop('checked');

		if (active) {
			$("#mailpassword").show();
		} else {
			$("#mailpassword").hide();
		}
	});
});