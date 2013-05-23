package controllers;

import play.*;
import play.mvc.*;

@With(Secure.class)
@Check("isAdmin")
public class NoteUsers extends CRUD
{
	
}