import subprocess

subprocess.run(["python3", "individual_scripts/updateMTAStations.py"], check=True)
subprocess.run(["python3", "individual_scripts/updateMTAComplexes.py"], check=True)
subprocess.run(["python3", "individual_scripts/updateElevators.py"], check=True)
subprocess.run(["python3", "individual_scripts/outageGeojsonParser.py"], check=True)
subprocess.run(["python3", "individual_scripts/writeStationCoords.py"], check=True)
subprocess.run(["python3", "individual_scripts/writeComplexCoords.py"], check=True)
subprocess.run(["python3", "individual_scripts/elevatorToComplexConnector.py"], check=True)