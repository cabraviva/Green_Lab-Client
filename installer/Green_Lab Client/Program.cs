using System;
using System.Diagnostics;

namespace Green_Lab_Client
{
    class Program
    {
        static void Main(string[] args)
        {
            Boolean _DEBUG = false;

            Console.WriteLine("Launching Green_Lab Client");

            ProcessStartInfo start = new ProcessStartInfo();
            start.Arguments = "greencoder001/Green_Lab-Client _green_lab-client-mc --logging win";
            start.FileName = "gli.exe";
            if (_DEBUG)
            {
                start.WindowStyle = ProcessWindowStyle.Normal;
                start.CreateNoWindow = false;
            } else
            {
                start.WindowStyle = ProcessWindowStyle.Hidden;
                start.CreateNoWindow = true;
            }
            
            int exitCode;

            using (Process proc = Process.Start(start))
            {
                proc.WaitForExit();

                // Retrieve the app's exit code
                exitCode = proc.ExitCode;

                Console.WriteLine("Exit Code: " + exitCode.ToString());
            }
        }
    }
}