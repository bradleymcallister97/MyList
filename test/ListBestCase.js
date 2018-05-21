var List = artifacts.require("./List.sol");

contract('List', function(accounts) {
    var listInstance;
    var seller = accounts[1];
    var buyer = accounts[2];
    var name = 'name 1';
    var description = 'description 1';
    var name2 = 'name 2';
    var description2 = 'description 2';
    var priceETH = 10;
    var price = web3.toWei(priceETH, 'ether');
    var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
    var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

    it('Should initalize correctly', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.getNumberArticles();
        }).then((data) => {
            assert.equal(data.toNumber(), 0, 'should be no articles');
            return listInstance.getArticlesForSale();
        }).then((data) => {
            assert.equal(data.length, 0, 'should be no articles for sale');
        });
    });

    it('Should sell first article', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.sellArticle(name, description, price, {from: seller});
        }).then((recipt) => {
            assert.equal(recipt.logs.length, 1, 'event should have been triggered');
            assert.equal(recipt.logs[0].event, 'LogSellArticle', 'event should be called LogSellArticle');
            assert.equal(recipt.logs[0].args._id.toNumber(), 1, 'Event should have correct id');
            assert.equal(recipt.logs[0].args._seller, seller, 'Event should have correct seller');
            assert.equal(recipt.logs[0].args._name, name, 'Event should have correct name');
            assert.equal(recipt.logs[0].args._price.toNumber(), price, 'Event should have correct price');
            return listInstance.getNumberArticles();
        }).then((data) => {
            assert.equal(data, 1, 'should have one article');
            return listInstance.getArticlesForSale();
        }).then((data) => {
            assert.equal(data.length, 1, 'should have one article for sale');
            assert.equal(data[0].toNumber(), 1, 'article id should be 1');
            return listInstance.articles(data[0]);
        }).then((data) => {
             assert.equal(data[0].toNumber(), 1, 'article id should be 1');
             assert.equal(data[1], seller, 'articles seller should be correct');
             assert.equal(data[2], 0x0, 'articles buyer should be empty');
             assert.equal(data[3], name, 'articles name should be correct');
             assert.equal(data[4], description, 'articles description should be correct');
             assert.equal(data[5].toNumber(), price, 'articles price should be correct');
        });
    });

    it('Should sell second article', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.sellArticle(name2, description2, price, {from: seller});
        }).then((recipt) => {
            assert.equal(recipt.logs.length, 1, 'event should have been triggered');
            assert.equal(recipt.logs[0].event, 'LogSellArticle', 'event should be called LogSellArticle');
            assert.equal(recipt.logs[0].args._id.toNumber(), 2, 'Event should have correct id');
            assert.equal(recipt.logs[0].args._seller, seller, 'Event should have correct seller');
            assert.equal(recipt.logs[0].args._name, name2, 'Event should have correct name');
            assert.equal(recipt.logs[0].args._price.toNumber(), price, 'Event should have correct price');
            return listInstance.getNumberArticles();
        }).then((data) => {
            assert.equal(data, 2, 'should have two article');
            return listInstance.getArticlesForSale();
        }).then((data) => {
            assert.equal(data.length, 2, 'should have two article for sale');
            assert.equal(data[1].toNumber(), 2, 'article id should be 2');
            return listInstance.articles(data[1]);
        }).then((data) => {
             assert.equal(data[0].toNumber(), 2, 'article id should be 2');
             assert.equal(data[1], seller, 'articles seller should be correct');
             assert.equal(data[2], 0x0, 'articles buyer should be empty');
             assert.equal(data[3], name2, 'articles name should be correct');
             assert.equal(data[4], description2, 'articles description should be correct');
             assert.equal(data[5].toNumber(), price, 'articles price should be correct');
        });
    });

    it('Should buy article', () => {
        return List.deployed().then((instance) => {
            listInstance = instance;
            sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber();
            buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber();
            return listInstance.buyArticle(1, {from: buyer, value: price});
        }).then((recipt) => {
            assert.equal(recipt.logs.length, 1, 'event should have been triggered');
            assert.equal(recipt.logs[0].event, 'LogBuyArticle', 'event should be called LogSellArticle');
            assert.equal(recipt.logs[0].args._id.toNumber(), 1, 'Event should have correct id');
            assert.equal(recipt.logs[0].args._seller, seller, 'Event should have correct seller');
            assert.equal(recipt.logs[0].args._buyer, buyer, 'Event should have correct buyer');
            assert.equal(recipt.logs[0].args._name, name, 'Event should have correct name');
            assert.equal(recipt.logs[0].args._price.toNumber(), price, 'Event should have correct price');
            sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber();
            buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber();
            assert.equal(Math.round(sellerBalanceAfterBuy * 100) / 100, Math.round((sellerBalanceBeforeBuy + priceETH) * 100) / 100, 'Seller should have earned article price');
            assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - priceETH, 'Buyer did not spend the article price');
            return listInstance.getArticlesForSale();
        }).then((data) => {
            assert.equal(data.length, 1, 'should only be one article for sale');
            assert.equal(data[0].toNumber(), 2, 'article for sale has correct id');
            return listInstance.getNumberArticles();
        }).then((data) => {
            assert.equal(data, 2, 'total number of articles is 2');
        });
    });
});
