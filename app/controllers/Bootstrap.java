package controllers;

import play.*;
import play.jobs.*;
import play.test.*;

import models.*;

@OnApplicationStart
public class Bootstrap extends Job {

    public void doJob() {
    	// One-time delete all users to enforce encryption
    	// User.deleteAll();
    	
        // Check if the database is empty
        if(NoteUser.count() == 0) {
            Fixtures.loadModels("initial-data.yml");
        }
    }
}
