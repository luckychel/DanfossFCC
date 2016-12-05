using System;
using UIKit;
using NetworkExtension;
using Foundation;
using Xamarin.Forms;

[assembly: Dependency(typeof( DanfossFCC.iOS.DeviceState))]
namespace DanfossFCC.iOS
{
    public class DeviceState : IDeviceState
    {
        public DeviceState()
        {
        }

        public bool isNetworkReachable()
        {
            bool hasInternet = true;

            if (!Reachability.IsHostReachable("http://ya.ru"))
            {
                hasInternet = false;
            }

            //var internetStatus = Reachability.InternetConnectionStatus();

            //if (internetStatus == NetworkStatus.NotReachable)
            //{
            //    hasInternet = false;

            //}


            return hasInternet;

        }
    }
}