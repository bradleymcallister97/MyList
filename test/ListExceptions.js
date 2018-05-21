var List = artifacts.require("./List.sol");

contract('List', function(accounts) {
    var listInstance;
    var seller = accounts[1];
    var buyer = accounts[2];
    var name = 'name 1';
    var description = 'description 1';
    var priceETH = 10;
    var price = web3.toWei(priceETH, 'ether');

    it('Should not be allowed to buy when there is no article', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.buyArticle(1, {from: buyer, value: price});
        }).then(assert.fail).catch((error) => {
            assert.true;
        }).then(() => {
            return listInstance.getNumberArticles();
        }).then((data) => {
            assert.equal(data.toNumber(), 0, 'should be no articles for sale');
        });
    });

    it('should throw exception if try to buy article that does not exist', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.sellArticle(name, description, price, {from: seller});
        }).then((recipt) => {
            return listInstance.buyArticle(2, {from: seller, value: price});
        }).then(assert.fail).catch((error) => {
            assert(true);
            return listInstance.articles(1);
        }).then((item) => {
            assert.equal(item[0].toNumber(), 1, 'Id should be 1');
            assert.equal(item[1], seller, 'Seller should be correct');
            assert.equal(item[2], 0x0, 'Buyer should be empty');
            assert.equal(item[3], name, 'Name should be correct');
            assert.equal(item[4], description, 'Description should be correct');
            assert.equal(item[5].toNumber(), price, 'Price should be correct');
        });
    });

    it('Should not be allowed to buy your own article', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.buyArticle(1, {from: seller, value: price});
        }).then(assert.fail).catch((error) => {
            assert(true);
            return listInstance.articles(1); 
        }).then((item) => {
            assert.equal(item[0].toNumber(), 1, 'Id should be 1');
            assert.equal(item[1], seller, 'Seller should be correct');
            assert.equal(item[2], 0x0, 'Buyer should be empty');
            assert.equal(item[3], name, 'Name should be correct');
            assert.equal(item[4], description, 'Description should be correct');
            assert.equal(item[5].toNumber(), price, 'Price should be correct');
        });
    });

    it('Should fail when incorrect eth value is sent', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.buyArticle(1, { from: buyer, value: price - web3.toWei(1, 'ether') });
        }).then(assert.fail).catch((error) => {
            assert(true);
            return listInstance.articles(1);
        }).then((item) => {
            assert.equal(item[0].toNumber(), 1, 'Id should be 1');
            assert.equal(item[1], seller, 'Seller should be correct');
            assert.equal(item[2], 0x0, 'Buyer should be empty');
            assert.equal(item[3], name, 'Name should be correct');
            assert.equal(item[4], description, 'Description should be correct');
            assert.equal(item[5].toNumber(), price, 'Price should be correct');
        });
    });

    it('Should not be able to buy article that has been sold', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.buyArticle(1, { from: buyer, value: price });
        }).then(() => {
            return listInstance.buyArticle(1, { from: buyer, value: price });
        }).then(assert.fail).catch((error) => {
            assert(true);
            return listInstance.articles(1);
        }).then((item) => {
            assert.equal(item[0].toNumber(), 1, 'Id should be 1');
            assert.equal(item[1], seller, 'Seller should be correct');
            assert.equal(item[2], buyer, 'Buyer should be correct');
            assert.equal(item[3], name, 'Name should be correct');
            assert.equal(item[4], description, 'Description should be correct');
            assert.equal(item[5].toNumber(), price, 'Price should be correct');
        });
    });
});