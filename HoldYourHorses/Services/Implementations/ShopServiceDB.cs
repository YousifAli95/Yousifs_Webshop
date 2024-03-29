﻿using HoldYourHorses.Models.Entities;
using HoldYourHorses.Services.DTOs;
using HoldYourHorses.Services.Interfaces;
using HoldYourHorses.Services.ServiceUtils;
using HoldYourHorses.ViewModels.Shop;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.EntityFrameworkCore;

namespace HoldYourHorses.Services.Implementations
{
    public class ShopServiceDB : IShopService
    {
        readonly ShopDBContext _shopContext;
        readonly IAccountService _accountService;
        readonly ITempDataDictionaryFactory _tempFactory;
        readonly IHttpContextAccessor _accessor;
        readonly CookieServiceUtil _cookieServiceUtil;
        readonly string _sessionSearchKey = "search";

        public ShopServiceDB(ShopDBContext shopContext, ITempDataDictionaryFactory tempFactory, IAccountService accountService, CookieServiceUtil cookieServiceUtil, IHttpContextAccessor accessor)
        {
            _shopContext = shopContext;
            _tempFactory = tempFactory;
            _accountService = accountService;
            _cookieServiceUtil = cookieServiceUtil;
            _accessor = accessor;
        }

        public async Task SaveOrder(CheckoutVM model)
        {
            Order order;
            string? userId = await _accountService.GetUserId();

            // Map the data from the viewmodel to the Order object
            order = new Order
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                Email = model.Email,
                City = model.City,
                ZipCode = model.ZipCode,
                Address = model.Address,
                Country = model.Country,
                User = userId,
                OrderDate = DateTime.Now
            };

            // Start a tranasaction so that either all database changes are saved or none are
            using (var transaction = _shopContext.Database.BeginTransaction())
            {
                _shopContext.Orders.Add(order);
                _shopContext.SaveChanges();

                AddOrderLines(order.Id);

                transaction.Commit();
            }

            // Saving temporary data 
            _tempFactory.GetTempData(_accessor.HttpContext)[nameof(OrderConfirmationVM.FirstName)] = model.FirstName;
            _tempFactory.GetTempData(_accessor.HttpContext)[nameof(OrderConfirmationVM.Email)] = model.Email;
        }

        public void AddOrderLines(int orderId)
        {
            List<ShoppingCartDTO> shoppingCart = _cookieServiceUtil.GetShoppingCartFromCookie();

            foreach (var item in shoppingCart)
            {
                // Retrieve the article from the database based on its ArticleNr
                var article = _shopContext.Articles.Find(item.ArticleNr);

                // Check if the article exists
                if (article != null)
                {
                    // Create an OrderLine object
                    OrderLine orderLine = new OrderLine()
                    {
                        Amount = item.Amount,
                        ArticleNr = article.ArticleNr,
                        Price = article.Price,
                        OrderId = orderId,
                        ArticleName = article.ArticleName
                    };

                    // Add the OrderLine to the OrderLines DbSet
                    _shopContext.OrderLines.Add(orderLine);
                }

                // Save changes to the database and commit the transaction
                _shopContext.SaveChanges();
            }
        }

        public ArticleDetailsVM? GetArticleDetailsVM(int articleNr)
        {
            // Returns an ArticleDetailsVM containing all the information needed for the articles view
            return _shopContext.Articles
                 .Where(o => o.ArticleNr == articleNr)
                 .Select(o => new ArticleDetailsVM()
                 {
                     ArticleNr = o.ArticleNr,
                     Price = o.Price,
                     HorsePowers = o.HorsePowers,
                     WoodDensity = o.TreeDensity,
                     ArticleName = o.ArticleName,
                     Material = o.Material.Name,
                     Category = o.Category.Name,
                     Description = o.Description,
                     ProductionCountry = o.OriginCountry.Name,
                     AbsBrake = o.AbsBrake,
                 })
                 .SingleOrDefault();
        }


        public OrderConfirmationVM GetOrderConfirmationVM()
        {
            // Get first name and last name from TempData
            return new OrderConfirmationVM
            {
                FirstName = (string)_tempFactory.GetTempData(_accessor.HttpContext)[nameof(OrderConfirmationVM.FirstName)],
                Email = (string)_tempFactory.GetTempData(_accessor.HttpContext)[nameof(OrderConfirmationVM.Email)]
            };
        }

        public async Task<ShoppingCartVM[]> GetShoppingCartVM()
        {
            // Initialize a list to store ShoppingCartVM objects
            var model = new List<ShoppingCartVM>();

            // Retrieve the shopping cart items as a List and extract the article numbers
            var shoppingCart = _cookieServiceUtil.GetShoppingCartFromCookie();
            var articleNumbers = shoppingCart.Select(p => p.ArticleNr);

            // Retrieve article information from the database for the items in the shopping cart
            var articles = await _shopContext.Articles
                .Where(article => articleNumbers.Contains(article.ArticleNr))
                .ToListAsync();

            // Populate the model with ShoppingCartVM objects
            foreach (var article in articles)
            {
                // Retrieve the quantity of each product from the shopping cart
                var amount = shoppingCart.SingleOrDefault(p => p.ArticleNr == article.ArticleNr)?.Amount ?? 0;

                // Create a ShoppingCartVM object and add it to the model
                model.Add(new ShoppingCartVM
                {
                    ArticleNr = article.ArticleNr,
                    ArticleName = article.ArticleName,
                    Price = article.Price,
                    Amount = amount
                });
            }

            // Convert the list of ShoppingCartVM objects to an array and return it
            return model.ToArray();
        }

        public async Task<IndexVM> GetIndexVM(string search)
        {
            var searchString = search ?? string.Empty;

            // Store the search string in the user's session
            _accessor.HttpContext.Session.SetString(_sessionSearchKey, searchString);

            // Retrieve articles from the database, including related category and material information
            var articles = await _shopContext.Articles
                .Include(a => a.Category)
                .Include(a => a.Material)
                .ToArrayAsync();

            // Prepare data for the Index View Model
            var indexVM = new IndexVM
            {
                PriceMax = decimal.ToInt32(articles.Max(o => o.Price)),
                PriceMin = decimal.ToInt32(articles.Min(o => o.Price)),
                HorsePowersMax = articles.Max(o => o.HorsePowers),
                HorsePowersMin = articles.Min(o => o.HorsePowers),
                Material = articles.Select(o => o.Material.Name).Distinct().ToArray(),
                Categories = articles.Select(o => o.Category.Name).Distinct().ToArray(),
                Search = searchString,
            };

            return indexVM;
        }

        public IndexPartialVM[] GetIndexPartial(int minPrice, int maxPrice, int minHorsePowers, int maxHorsePowers, string category,
            string materials, bool isAscending, string sortOn)
        {
            // Retrieve the search string from the user's session
            string searchString = _accessor.HttpContext.Session.GetString(_sessionSearchKey);

            // Build a query to filter articles based on the function parameters
            var articlesQuery = _shopContext.Articles
                .Where(o => o.Price >= minPrice && o.Price <= maxPrice)
                .Where(o => o.HorsePowers >= minHorsePowers && o.HorsePowers <= maxHorsePowers)
                .Where(o => category.Contains(o.Category.Name) && materials.Contains(o.Material.Name))
                .Where(o => string.IsNullOrEmpty(searchString) || o.ArticleName.Contains(searchString))
                .Select(o => new IndexPartialVM
                {
                    ArticleName = o.ArticleName,
                    Price = o.Price,
                    ArticleNr = o.ArticleNr,
                })
                .AsEnumerable();

            IEnumerable<IndexPartialVM> sortedQuery;

            // Sort the query using reflection based on the property name 
            if (isAscending)
                sortedQuery = articlesQuery.OrderBy(o => o.GetType().GetProperty(sortOn).GetValue(o, null));
            else
                sortedQuery = articlesQuery.OrderByDescending(o => o.GetType().GetProperty(sortOn).GetValue(o, null));

            // Convert the sorted query to an array of IndexPartialVM
            return sortedQuery.ToArray();
        }

        public async Task<CompareVM[]> GetCompareVM()
        {
            List<int> compareList = _cookieServiceUtil.GetCompareListFromCookie();

            // Query the database to fetch article details for comparison based on the article numbers
            var model = await _shopContext.Articles
                .Where(o => compareList.Contains(o.ArticleNr))
                .Select(o => new CompareVM
                {
                    ArticleName = o.ArticleName,
                    ArticleNr = o.ArticleNr,
                    HorsePowers = o.HorsePowers,
                    Country = o.OriginCountry.Name,
                    Material = o.Material.Name,
                    Category = o.Category.Name,
                    WoodDensity = o.TreeDensity
                })
                .ToArrayAsync();

            // Return an array of CompareVM representing articles for comparison
            return model;
        }

        public int GetShoppingCartCount()
        {
            return _cookieServiceUtil.GetShoppingCartCount();
        }

    }
}
