import subprocess

subprocess.run(["python3", "individual_scripts/updateElevators.py"])
subprocess.run(["python3", "individual_scripts/outageGeojsonParser.py"])
subprocess.run(["python3", "individual_scripts/writeStationCoords.py"])
subprocess.run(["python3", "individual_scripts/convertComplexCSVToJSON.py"])
subprocess.run(["python3", "individual_scripts/writeComplexCoords.py"])
subprocess.run(["python3", "individual_scripts/elevatorToComplexConnector.py"])