using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xamarin.Forms;

namespace DanfossFCC
{

    // required temporarily for iOS, due to BaseUrl bug
    public interface IBaseUrl { string Get(); }

    public partial class App : Application
    {
        public App()
        {
            {
            }
        }
    }
}
