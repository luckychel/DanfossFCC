using System.Threading.Tasks;
using Android.App;
using Android.Content;
using Android.OS;
using Android.Util;

namespace DanfossFCC.Droid
{
    [Activity(Theme = "@style/MyTheme.Splash", MainLauncher = true, NoHistory = true)]
    public class SplashActivity : Activity
    {
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            this.RequestedOrientation = Android.Content.PM.ScreenOrientation.Sensor;

            StartActivity(typeof(MainActivity));
        }

        
    }
}