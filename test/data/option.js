var expect = require('expect.js');

var optionTests = function(data) {
	describe('Option', function(){
		var Option = data.model('Option');
		
		it('should return Option object', function() {
			expect(Option).to.be.a(Object);
			expect(Option.modelName).to.eql('Option');
		});
	});
}

module.exports = optionTests;
