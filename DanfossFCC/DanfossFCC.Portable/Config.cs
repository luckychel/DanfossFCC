namespace DanfossFCC
{
    using System.IO;
    using System.Threading.Tasks;
    using Xamarin.Forms;
    using XLabs.Forms.Controls;
    using System.Net.Http;
    using Newtonsoft.Json;
    using System.Reflection;
    using System.Net;
    using System;

    public class Config : ContentPage
    {
        private readonly HybridWebView hybrid;
        public Config()
        {

            this.Content = this.hybrid = new HybridWebView
            {
                HorizontalOptions = LayoutOptions.FillAndExpand,
                VerticalOptions = LayoutOptions.FillAndExpand,
                BackgroundColor = Color.White
            };

            this.Padding = new Thickness(0, Device.OnPlatform(20, 0, 0), 0, 0);

            this.hybrid.RegisterNativeFunction("getFileData", t =>
            {
                var ci = DependencyService.Get<ILocale>().GetCurrentCultureInfo();
                var lang = ci.TwoLetterISOLanguageName;
                if (!lang.Equals("ru") && !lang.Equals("en")) lang = "en";

                var assembly = typeof(Config).GetTypeInfo().Assembly;
                Stream stream = assembly.GetManifestResourceStream("DanfossFCC." + string.Format(t, lang));
                string data = "";
                using (var reader = new System.IO.StreamReader(stream))
                {
                    data = reader.ReadToEnd();
                }

                string platform = "";
                if (Device.OS == TargetPlatform.iOS)
                {
                    platform = ((int)TargetPlatform.iOS).ToString();
                }
                else if (Device.OS == TargetPlatform.Android)
                {
                    platform = ((int)TargetPlatform.Android).ToString();
                }
                else if (Device.OS == TargetPlatform.Windows)
                {
                    platform = ((int)TargetPlatform.Windows).ToString();
                }
                //return new[] { data }; //data.toString()
                return new object[]{ new[] { data, lang, platform } }; //data[0].toString() and data[1].toString()
            });

            this.hybrid.RegisterNativeFunction("getDanfossData", t =>
            {
                //проверяем доступ к интернету
                bool state = DependencyService.Get<IDeviceState>().isNetworkReachable();
                if (!state) return new[] { "Error" };

                var data = GetDanfossDataSync(t);

                data = data.Substring(1, data.Length - 2);

                return new[] { data };
            });

        }

      

        private async Task<string> GetDataAsync(string file)
        {
            var fileService = DependencyService.Get<ISaveAndLoad>();

            var result = "";
            if (fileService.FileExists(file))
            {
                result = await fileService.LoadTextAsync(file);
            }
            return result.ToString();
        }

        public async Task<string> GetDanfossDataAsync(string parameters)
        {
            var client = new HttpClient();
            //client.Timeout = TimeSpan.FromSeconds(5);
            //client.DefaultRequestHeaders.Add("Request-Timeout", "5000");
            client.DefaultRequestHeaders.Add("Accept", "application/json");

            var json = JsonConvert.DeserializeObject<DP>(parameters);
            var response = await client.GetAsync(string.Format("http://rucoecom.danfoss.com/ExtDS/jDS.asmx/{0}?{1}", json.method, json.param));

            var airportJson = response.Content.ReadAsStringAsync().Result;

            ////var rootobject = JsonConvert.DeserializeObject<Rootobject>(airportJson);

            return airportJson;

        }

        public string GetDanfossDataSync(string parameters)
        {
            string responseString = "";
            using (var client = new HttpClient())
            {
                //client.Timeout = TimeSpan.FromSeconds(5);
                //client.DefaultRequestHeaders.Add("Request-Timeout", "5000");
                client.DefaultRequestHeaders.Add("Accept", "application/json");

                var json = JsonConvert.DeserializeObject<DP>(parameters);
                
                var response = client.GetAsync(string.Format("http://rucoecom.danfoss.com/ExtDS/jDS.asmx/{0}?{1}", json.method, json.param)).Result;

                if (response.IsSuccessStatusCode)
                {
                    // by calling .Result you are performing a synchronous call
                    var responseContent = response.Content;

                    // by calling .Result you are synchronously reading the result
                    responseString = responseContent.ReadAsStringAsync().Result;
                }
                else {
                    responseString = "Error";
                }
            }
            return responseString;
        }
        
        #region Overrides of Page
        protected override void OnAppearing()
        {
            base.OnAppearing();
            this.hybrid.LoadFromContent("www/webPage.html");
        }

        #endregion
    }

    public class SendObject
    {
        public double X { get; set; }
        public double Y { get; set; }
    }

    public class DP {
        public string method { get; set; }
        public string param { get; set; }
        
    }
    
}
