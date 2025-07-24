import subprocess

subprocess.run(["python3", "outageGeojsonParserPy.py"])
subprocess.run(["python3", "writeStationCoords.py"])
subprocess.run(["python3", "convertComplexCSVToJSON.py"])
subprocess.run(["python3", "writeComplexCoords.py"])
subprocess.run(["python3", "elevatorToComplexonnector.py"])