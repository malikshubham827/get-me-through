import sys,json,numpy as np
import face_recognition
import cv2
# for feeding data
import glob,os
from pathlib import Path
import numpy as np
home = str(os.path.dirname(os.path.abspath(__file__))) + "/../../"
file_names = glob.glob(home + "/known_people/*.jp*g")
#end

print("In the py\n", flush=True)
#Read data from stdin
def read_in():
    lines = sys.stdin.readline()
    # Since our input would only be having one line, parse our JSON data from that
    return lines

#Function to check if the person is authorised based on certain parameters


def authorised(name):
    # Assuming if person is not in Database then it is Un-authorised
    return not "Unknown" in name


def main():
    # GETTING KNOWN ENCODINGS AND NAMES
    home = str(os.path.dirname(os.path.abspath(__file__))) + "/../../"
    known_encodings_file_path = home + "/data/known_encodings_file.csv"
    people_file_path = home + "/data/people_file.csv"
    # For storing the encoding of a face
    known_encodings_file = Path(known_encodings_file_path)
    if known_encodings_file.is_file():
        known_encodings = np.genfromtxt(known_encodings_file, delimiter=',')
    else:
        known_encodings = []

    # #For Storing the name corresponding to the encoding
    people_file = Path(people_file_path)
    if people_file.is_file():
        people = np.genfromtxt(people_file, dtype='U',delimiter=',')
    else:
        people = []



# MAIN WORK

    #Capture Video indefinitely
    video_capture = cv2.VideoCapture(0)
    # time.delay(2)
    # TODO: GET FROM DATABASE
    # known encodings of persons in database.
    # known_encodings = []
    # people = []

    #Some important variables
    face_locations = []
    face_encodings = []
    face_names = []
    process_this_frame = True
    #Eat the Meat, Hmm process the image
    while True:

        # 
        #     1.) Capture the frame from the video.
        #     2.) Compress it to its 1/4th size for faster speed.
        #     3.) If this frame has to be processed, find face_location, face_encodings.
        #     4.) Match with the known_encodings and set the name for each face else Unknown
        #     5.) Add a border around face.
        #         if RED: 
        #             unverified or not authenticated
        #         elif GREEN:
        #             everything OK ;)
        #     6.) Show the frame 
        # 
        ret, frame = video_capture.read()

        #smaller frame 1/4th of original size
        small_frame = cv2.resize(frame, (0,0), fx=.25, fy=.25)

        if process_this_frame:
            #Find the face locations
            face_locations = face_recognition.face_locations(small_frame)
            #Find the face encodings 128 Dimensional!!
            face_encodings = face_recognition.face_encodings(small_frame, face_locations)

            face_names=[]
            other = 0 #Count of un-authorised people
            for face_encoding in face_encodings:
                match = face_recognition.compare_faces(known_encodings, face_encoding)
                name = "Unknown"

                #Find if this person is in the present people array
                for i in range(len(match)):
                    if match[i]:
                        name = people[i]
                        break

                if "Unknown" in name:
                    other += 1
                    name += str(other)
                face_names.append(name)
        
        # Send the names of the people to the parent process
        # os.write(3,b'{"dt" : "This is a test"}')
        print(face_names, flush=True)
            
        process_this_frame = not process_this_frame
        

        #Display the border
        for (top, right, bottom, left),name in zip(face_locations, face_names):
            #Scale up the coordinates by 4 to get face
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4

            #Assuming person in authenticated
            color =  (0,255,0)  #GREEN
            if not authorised(name):
                #Unauthenticated person
                color = (0,0,255) #RED
                #print so that parent process in Node.js can use it
                print(name,flush=True)

            #Display border
            cv2.rectangle(frame, (left,top), (right,bottom), color, 2)

            # Draw a label with name
            cv2.rectangle(frame, (left,bottom-35), (right, bottom), color, cv2.FILLED)
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(frame, name,(left+6, bottom-6), font, 1.0, (255,255,255), 1)

        # Display the resulting image with borders and names
        cv2.imshow('Video', frame)

        # Hit 'q' on keyboard to quit
        if cv2.waitKey(100) == 27:
            break
            
    #Release handle to the webcam
    video_capture.release()
    cv2.closeAllWindows()


#start process
if __name__ == '__main__':
    main()
