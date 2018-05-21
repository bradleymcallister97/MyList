App = {
    web3Provider: null,
    contracts: {},
    account: 0x0,
    loading: false,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            // reuse the provider of Web3 object injected by Metamask
            App.web3Provider = web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        App.displayAccountInfo();

        return App.initContract();
    },

    displayAccountInfo: function() {
        web3.eth.getCoinbase(function(error, account) {
            if (error) {
                console.error(error.message);
            }
            App.account = account;
            $('#account').text(account);
            web3.eth.getBalance(account, function(error, balance) {
                if (error) {
                    console.error(error.message);
                }
                var roundedBal = Math.round(web3.fromWei(balance, 'ether').toNumber() * 100) / 100;
                $('#accountBalance').text(roundedBal + ' ETH');
            })
        });
    },

    displayArticle: function(id, seller, name, description, price) {
        var priceEth = web3.fromWei(price, 'ether');

        var articlesTemplate = $('#articleTemplate');
        articlesTemplate.find('.panel-title').text(name);
        articlesTemplate.find('.article-description').text(description);
        articlesTemplate.find('.article-price').text(priceEth);
        articlesTemplate.find('.btn-buy').attr('data-id', id);
        articlesTemplate.find('.btn-buy').attr('data-value', priceEth);

        if (seller === App.account){
            articlesTemplate.find('.article-seller').text('You');
            articlesTemplate.find('.btn-buy').hide();
        } else {
            articlesTemplate.find('.article-seller').text(seller);
            articlesTemplate.find('.btn-buy').show();
        }

        $('#articlesRow').append(articlesTemplate.html());
    },

    initContract: function () {
        $.getJSON('List.json', function(ListArtifact) {
            App.contracts.list = TruffleContract(ListArtifact);
            App.contracts.list.setProvider(App.web3Provider);
            App.listenToEvents();
            return App.reloadArticles();
        });
    },

    reloadArticles: function() {
        // avoid reentry
        if (App.loading) {
            return;
        }

        App.loading = true;

        App.displayAccountInfo();

        var listInstance;

        
        App.contracts.list.deployed().then((instance) => {
            listInstance = instance;
            return listInstance.getArticlesForSale();
        }).then((articleIds) => {
            $('#articlesRow').empty();

            for (var i = 0; i < articleIds.length; i++) {
                var articleId = articleIds[i];
                listInstance.articles(articleId.toNumber()).then((article) => {
                    App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
                });
            }
            App.loading = false;
        }).catch((error) => {
            console.error(error.message);
            App.loading = false;
        });
    },

    sellArticle: function() {
        var _name = $('#article_name').val();
        var _description = $('#article_description').val();
        var _price = web3.toWei(parseFloat($('#article_price').val() || 0), 'ether');

        if (_name.trim() == '' || _price == 0){
            return false;
        }

        App.contracts.list.deployed().then((instance) => {
            return instance.sellArticle(_name, _description, _price, {
                from: App.account,
                gas: 500000
            });
        }).catch((error) => {
            console.error(error.message);
        });
    },

    listenToEvents: function() {
        App.contracts.list.deployed().then((instance) => {
            instance.LogSellArticle({}, {}).watch((error, event) => {
                if (error) {
                    console.error(error.message);
                } else {
                    $('#events').append('<li class="list-group-item">' + event.args._name + ' is now for sale </li>');
                }
                App.reloadArticles();
            });
            instance.LogBuyArticle({}, {}).watch((error, event) => {
                if (error) {
                    console.error(error.message);
                } else {
                    $('#events').append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + ' </li>');
                }
                App.reloadArticles();
            });
        });
    },

    buyArticle: function() {
        event.preventDefault();
        var articleId = $(event.target).data('id');
        var price = parseFloat($(event.target).data('value'));

        App.contracts.list.deployed().then((instance) => {
            return instance.buyArticle(articleId, {from: App.account, value: web3.toWei(price, 'ether'), gas: 500000});
        }).catch((error) => {
            console.log(error);
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
